"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Browser = "chrome" | "firefox";

const instructions: Record<Browser, { file: string; steps: string[] }> = {
  chrome: {
    file: "/downloads/savebot-chrome.zip",
    steps: [
      "Download the zip file using the button above and unzip it to a folder.",
      "Open Chrome and type chrome://extensions into the address bar.",
      'Turn on "Developer mode" in the top-right corner.',
      'Click "Load unpacked" and select the unzipped folder.',
      "To pin it, click the Extensions icon (puzzle piece) in the toolbar and pin SaveBot.",
      "Go to savebot.app, make an account, and then log in with that same account on the extension.",
    ],
  },
  firefox: {
    file: "/downloads/savebot-firefox.zip",
    steps: [
      "Download the zip file using the button above.",
      "Type about:debugging into the address bar.",
      'Click on "This Firefox" (or "This Nightly") in the left-hand sidebar.',
      'Find the Temporary Extensions section and click the "Load Temporary Add-on..." button.',
      "Select any file inside the unzipped extension folder.",
      'To pin it, click the Extensions icon (puzzle piece) in the toolbar, click the Gear icon next to the extension, and select "Pin to Toolbar".',
      "Go to savebot.app, make an account, and then log in with that same account on the extension.",
    ],
  },
};

export default function DownloadPage() {
  const [browser, setBrowser] = useState<Browser>("chrome");
  const current = instructions[browser];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            SaveBot
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">Get the Browser Extension</h1>
        <p className="text-neutral-500 mb-8">
          Save articles, highlights, and PDFs directly from your browser.
        </p>

        {/* Browser tabs */}
        <div className="flex gap-1 mb-6 border-b border-neutral-200 dark:border-neutral-800">
          {(["chrome", "firefox"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBrowser(b)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                browser === b
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              {b === "chrome" ? "Chrome" : "Firefox"}
            </button>
          ))}
        </div>

        {/* Download button */}
        <a
          href={current.file}
          download
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download for {browser === "chrome" ? "Chrome" : "Firefox"}
        </a>

        {/* Install steps */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Installation Steps</h2>
          <ol className="space-y-3">
            {current.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-neutral-700 dark:text-neutral-300">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
