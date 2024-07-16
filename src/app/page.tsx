"use client";

import React from "react";
import { motion } from "framer-motion";
import { useCompletion } from 'ai/react';
import LinkPreview from "@/components/ui/link-preview";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
 
export default function Home() {
  const { completion, input, handleInputChange, handleSubmit } =
    useCompletion();

  const placeholders = [
    "what songs do sam and joe have in common?",
    "find me a drummer that knows 'anthropology'",
    "who knows the same songs as me?",
    "give me five trombone players in san mateo, ca",
  ];
 
  return (
    <div>
      <div className="flex justify-center mt-48 items-center flex-col">
        <p className="text-neutral-500 dark:text-neutral-400 text-xl md:text-3xl max-w-3xl mx-auto mb-10">
          {" "}
          welcome to{" "}
          <LinkPreview url="" className="font-bold">
            yardbird.live
          </LinkPreview>
        </p>
      </div>
      <div className="flex flex-col justify-center items-center px-16">
        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
        />
        {completion}
      </div>
      <div className="flex justify-center items-center my-48 flex-col">
        <p className="text-neutral-500 dark:text-neutral-400 text-m md:text-l max-w-3xl mx-auto">
        inspired by{" "}
          <LinkPreview
            url="https://buildspace.so"
            className="font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-500 to-pink-500"
          >
            sage
          </LinkPreview> from buildspace
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 text-m md:text-l max-w-3xl mx-auto">
          a nights and weekends s5 production
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 text-m md:text-l max-w-3xl mx-auto">
          created by neo sud and sam iannone
        </p>
      </div>
    </div>
  );
}
