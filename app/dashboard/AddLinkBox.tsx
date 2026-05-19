"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getCsrfToken } from "@/lib/csrfClient";
import toast from "react-hot-toast";

import { validateUrl } from "@/lib/urlValidation";
import type { Link as ProfileLink } from "@/app/[username]/types/type";

const POPULAR_PLATFORMS = [
    { value: "github", label: "GitHub" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "x", label: "X (Twitter)" },
    { value: "youtube", label: "YouTube" },
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
    { value: "discord", label: "Discord" },
    { value: "leetcode", label: "LeetCode" },
    { value: "medium", label: "Medium" },
    { value: "devto", label: "Dev.to" },
    { value: "hashnode", label: "Hashnode" },
    { value: "twitch", label: "Twitch" },
    { value: "dribbble", label: "Dribbble" },
    { value: "website", label: "Personal Website / Other" },
];

/**
 * AddLinkBox Component
 * Renders a form to add a new link to the user's profile.
 * It includes inputs for platform selection, custom display name, and URL.
 *
 * @param {Object} props - The component props.
 * @param {function} props.onAdded - Callback function triggered when a new link is successfully added.
 */
export default function AddLinkBox({
    onAdded,
}: {
    onAdded: (link: ProfileLink) => void;
}) {
    const [url, setUrl] = useState("");
    const [label, setLabel] = useState("");
    const [platform, setPlatform] = useState("");
    const [loading, setLoading] = useState(false);

    /**
     * Handles the form submission to add a link.
     * Validates input fields and sends a POST request to the API.
     */
    async function submit() {
        const validation = validateUrl(url);
        if (!validation.valid) {
            return toast.error(validation.error);
        }

        if (!platform) {
            return toast.error("Please select a platform");
        }

        const finalLabel = label.trim();
        if (!finalLabel) {
            return toast.error("Please enter a name for this link");
        }

        setLoading(true);
        const csrfToken = await getCsrfToken();

        const res = await fetch("/api/links", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken,
            },
            body: JSON.stringify({
                url,
                label: finalLabel,
                platform,
            }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
            return toast.error(data.error ?? "Failed to add link");
        }

        toast.success("Link added");
        onAdded(data.link);

        setUrl("");
        setLabel("");
        setPlatform("");
    }

    return (
        <div className="rounded-lg border p-4 space-y-3">
            <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                    {POPULAR_PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                            {p.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Input
                placeholder="Link Display Name (e.g. My Resume, My Blog)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
            />

            <Input
                placeholder="Paste your link here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
            />

            <Button onClick={submit} disabled={loading} className="w-full">
                {loading ? "Adding…" : "Add link"}
            </Button>
        </div>
    );
}
