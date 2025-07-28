"use client";
import Image from "next/image";

interface ApprovalStampProps {
  isApproved?: boolean;
  className?: string;
}

export function ApprovalStamp({ isApproved = true, className = "" }: ApprovalStampProps) {
  if (!isApproved) {
    return null;
  }

  return (
    <div className={`absolute -top-4 -left-4 z-10 ${className}`}>
      <div className="relative">
        <Image
          src="/images/approved.png"
          alt="Approved Stamp"
          width={80}
          height={80}
          className="drop-shadow-lg"
        />
      </div>
    </div>
  );
} 