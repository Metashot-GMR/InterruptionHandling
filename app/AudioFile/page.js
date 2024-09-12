"use client";
import React, { useRef, useState } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

const subscriptionKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
const serviceRegion = "centralindia"; // e.g., "eastus"

const speechConfig = sdk.SpeechConfig.fromSubscription(
  subscriptionKey,
  serviceRegion
);
speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural"; // Set your preferred voice
const pushStream = sdk.AudioInputStream.createPushStream();
const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

export default function TestPage() {
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);

  const synthesizeText = () => {
    // Create a PushAudioOutputStream

    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("Synthesis finished.");

          // Convert audio stream to Blob and create a URL
          const audioBlob = new Blob([pushStream.readStream()], {
            type: "audio/wav",
          });
          const audioUrl = URL.createObjectURL(audioBlob);

          // Set the audio URL and play
          setAudioUrl(audioUrl);
          audioRef.current.play();
        } else {
          console.error("Synthesis failed:", result.errorDetails);
        }
        synthesizer.close();
      },
      (error) => {
        console.error("Error:", error);
        synthesizer.close();
      }
    );
  };

  const text = "Hello, this is a test synthesis using Azure Speech SDK.";

  return (
    <div>
      <h1>Test Page</h1>
      <button onClick={synthesizeText}>Synthesize Text</button>
      <audio ref={audioRef} controls src={audioUrl} />
    </div>
  );
}
