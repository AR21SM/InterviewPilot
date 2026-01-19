import { AccessToken } from "livekit-server-sdk";
import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const ALLOWED_TYPES = new Set(["behavioral", "technical", "system_design"]);
const ALLOWED_LEVELS = new Set(["intern", "junior", "mid"]);
const ALLOWED_COUNTS = new Set([3, 5]);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));

        const interviewType = (typeof body.interview_type === "string" ? body.interview_type.toLowerCase() : "behavioral");
        const level = (typeof body.level === "string" ? body.level.toLowerCase() : "mid");
        const questionCount = (typeof body.question_count === "number" ? body.question_count : 3);
        const targetRole = (typeof body.target_role === "string" ? body.target_role.slice(0, 100) : "");
        const focusTopic = (typeof body.focus_topic === "string" ? body.focus_topic.slice(0, 100) : "");

        const validatedType = ALLOWED_TYPES.has(interviewType) ? interviewType : "behavioral";
        const validatedLevel = ALLOWED_LEVELS.has(level) ? level : "mid";
        const validatedCount = ALLOWED_COUNTS.has(questionCount) ? questionCount : 3;

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const livekitUrl = process.env.LIVEKIT_URL;

        if (!apiKey || !apiSecret || !livekitUrl) {
            return NextResponse.json(
                { error: "LiveKit server credentials misconfigured" },
                { status: 500 }
            );
        }

        const roomName = `room-${crypto.randomBytes(6).toString("hex")}`;
        const participantIdentity = `candidate-${crypto.randomBytes(4).toString("hex")}`;

        const at = new AccessToken(apiKey, apiSecret, {
            identity: participantIdentity,
            ttl: "1h",
        });

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        at.metadata = JSON.stringify({
            interview_type: validatedType,
            level: validatedLevel,
            question_count: validatedCount,
            target_role: targetRole,
            focus_topic: focusTopic,
        });

        const token = await at.toJwt();

        return NextResponse.json({
            token,
            url: livekitUrl,
            roomName,
        });
    } catch (e: any) {
        return NextResponse.json(
            { error: e.message || "Failed to initialize interview session" },
            { status: 500 }
        );
    }
}
