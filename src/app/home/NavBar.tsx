"use client";

import { Button } from "@crayonai/react-ui";
import Image from "next/image";
import { ArrowRight, Github } from "lucide-react";

export const NavBar = () => {
  return (
    <div className="fixed top-0 left-0 w-full z-10 bg-container">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <Image
            src="/chat-logo.png"
            alt="Chat with C1"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <div className="flex items-center gap-1">
            <h1 className="text-primary">Search</h1>
            <p className="text-secondary">by thesys</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="medium"
            onClick={() =>
              window.open(
                "https://github.com/thesysdev/search-with-c1",
                "_blank"
              )
            }
          >
            <Github className="h-4 w-4" />
            Github
          </Button>
          <Button
            variant="secondary"
            size="medium"
            onClick={() =>
              window.open("https://docs.thesys.dev/welcome", "_blank")
            }
          >
            Build with Thesys
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
