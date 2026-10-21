"use client";

import { useEffect } from "react";

export default function Redirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to + window.location.search);
  }, [to]);
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${to}`} />
      <p className="p-6 text-body">
        Moved to <a href={to} className="text-coral underline">{to}</a>
      </p>
    </>
  );
}
