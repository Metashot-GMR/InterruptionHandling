"use client";

import React, { useState } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

// Initialize the Speech Synthesizer

const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
const region = "centralindia";

// Speech configuration setup
const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, region);
speechConfig.speechSynthesisLanguage = "en-IN";
speechConfig.speechSynthesisVoiceName = "en-IN-AnanyaNeural";

// Audio configuration setup
const player = new sdk.SpeakerAudioDestination();

const audioConfig = sdk.AudioConfig.fromSpeakerOutput(player);

const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

const TTSPage = () => {
  const [time, setTime] = useState(0);

  // Function to start TTS
  const startTTS = async () => {
    //Configurations
    console.log(player.internalAudio.currentTime);
    if (!synthesizer) {
      console.error("Synthesizer not initialized.");
      return;
    }

    // Stop any currently playing audio and reset the media source

    console.log(player);
    console.log(player.privSourceBuffer);
    const message =
      "Hello, this is a sample Text-to-Speech test with interruption handling.";
    synthesizer.speakTextAsync(
      "Hello, this is a sample Text-to-Speech test with interruption handling. One Two Three Four Five Six Seven Eight Nine Ten Eleven Tweleve Thirteen Fourteen Fifteen.",
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("Speech synthesized successfully.");
          let audioElem = player.internalAudio;
          let endTime = audioElem.buffered.end(0);
          console.log(player.internalAudio.buffered);
          console.log("End Time: ", endTime);
          console.log("buffer length", audioElem.buffered.length);
          //player.internalAudio.currentTime = endTime;
          audioElem.addEventListener("ended", () => {console.log("Ended")});
          
        } else {
          console.error("Error synthesizing speech:", result.errorDetails);
        }
      },
      (error) => {
        console.error("Error synthesizing speech:", error);
      }
    );

    // setTimeout(() => {
    //   player.close();
    //   synthesizer.close();
    //   console.log("Stopped")
    // }, 2000);
    // const utterance = new SpeechSynthesisUtterance(message);
    // speechSynthesis.speak(utterance);
    // setTimeout(() => {
    //   speechSynthesis.cancel();
    //   console.log("Stopped")
    // }, 100000);
  };

  // Function to stop TTS
  const stopTTS = () => {
    if (!synthesizer) {
      console.error("Synthesizer not initialized.");
      return;
    
    }

    // Stop playback and reset
    //player.internalAudio.pause(); // Pause current playback
    //setTime(player.internalAudio.currentTime); // Save current time if needed
    //player.internalAudio.currentTime = 0; // Reset playback to start
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Azure Speech TTS Interruption Demo</h1>
      <button onClick={startTTS} style={buttonStyle}>
        Start TTS
      </button>
      <button onClick={stopTTS} style={buttonStyle}>
        Stop TTS
      </button>
    </div>
  );
};

// Button styles
const buttonStyle = {
  padding: "10px 20px",
  margin: "10px",
  fontSize: "16px",
  cursor: "pointer",
  borderRadius: "5px",
};

export default TTSPage;
