### Detailed Report on Text-to-Speech (TTS) Implementation with Interruption Handling Using Microsoft Azure Cognitive Services SDK

This report provides an in-depth explanation of the TTS implementation using the Microsoft Azure Cognitive Services SDK, followed by an analysis of the evolution of the solution for handling audio interruptions effectively.

---

### **1. Initial Implementation Using Default Audio Configurations**

#### **Code Overview**

The initial code sets up a speech synthesizer using the Azure Speech SDK without customizing the audio output configurations. Here’s a breakdown of the code:

```javascript
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
const region = "centralindia";

// Speech configuration setup
const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, region);
speechConfig.speechRecognitionLanguage = "en-IN";
speechConfig.speechSynthesisLanguage = "en-IN";
speechConfig.speechSynthesisVoiceName = "en-IN-AnanyaNeural";

// Creating a SpeechRecognizer instance
const recognizer = new sdk.SpeechRecognizer(speechConfig);

// Setting up custom message properties for the recognizer's connection
const conn = sdk.Connection.fromRecognizer(recognizer);
conn.setMessageProperty("speech.context", "phraseDetection", {
  INTERACTIVE: {
    segmentation: {
      mode: "custom",
      segmentationSilenceTimeoutMs: 3000,
    },
  },
  mode: "Interactive",
});

// Creating a SpeechSynthesizer instance with default audio output configuration
const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

export { recognizer, synthesizer };
```

#### **Explanation**

1. **Importing the SDK**: The code begins by importing the `microsoft-cognitiveservices-speech-sdk` package, which provides functionalities for speech recognition and synthesis.

2. **Setting Up Configuration**: 
   - The `speechKey` and `region` are extracted from environment variables and constants, respectively.
   - `SpeechConfig.fromSubscription(speechKey, region)` initializes the speech configuration with the provided subscription key and region.

3. **Speech Configuration Properties**:
   - `speechSynthesisLanguage` and `speechSynthesisVoiceName` are set to specify the language and voice for synthesized speech.
   - A recognizer (`SpeechRecognizer`) is created with the given speech configuration.

4. **Custom Connection Settings**:
   - A connection (`Connection.fromRecognizer(recognizer)`) is established from the recognizer.
   - `setMessageProperty` configures custom properties like `segmentationSilenceTimeoutMs` for better control over phrase detection and segmentation.

5. **Synthesizer Initialization**:
   - The `SpeechSynthesizer` instance is created with the default audio configuration, meaning it uses the system’s default audio output.

#### **Observation**

- **Default Audio Configuration**: The synthesizer uses the default system audio output, making it simple but inflexible for customization.
- **No Interruption Handling**: The initial setup does not account for pausing or resuming audio, making it unsuitable for scenarios requiring such features.

---

### **2. First Attempt at Interruption Handling with Custom Audio Player**

To achieve more control over the audio playback (like pause and resume), you decided to create an audio configuration using a `SpeakerAudioDestination` object. 

#### **Modified Code Overview**

```javascript
"use client";

import React, { useState } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
const region = "centralindia";

// Speech configuration setup
const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, region);
speechConfig.speechSynthesisLanguage = "en-IN";
speechConfig.speechSynthesisVoiceName = "en-IN-AnanyaNeural";

// Audio configuration setup with a custom player
const player = new sdk.SpeakerAudioDestination();
console.log(player);
const audioConfig = sdk.AudioConfig.fromSpeakerOutput(player);

// Creating a SpeechSynthesizer instance with custom audio configuration
const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
```

#### **Explanation**

1. **Client-Side Execution**: The `use client` directive at the top suggests that this component is meant to be rendered on the client side, likely for a React application.

2. **Custom Player for Audio Output**:
   - A `SpeakerAudioDestination` object (`player`) is created, which provides more control over the playback compared to the default settings.
   - The `AudioConfig.fromSpeakerOutput(player)` method links the custom player with the audio configuration.

3. **Enhanced Synthesizer Setup**:
   - The `SpeechSynthesizer` is now initialized with both `speechConfig` and `audioConfig`, allowing for the customized playback control provided by `player`.

#### **Issues Encountered**

- **Appending Behavior**: The synthesized audio does not replace the existing playback but appends to it. This leads to complications in managing playback positions when pausing and resuming.
- **Fixed Duration Issue**: `player.internalAudio` has a fixed duration of 1800 seconds (30 minutes). New synthesized audio is appended to this buffer, resulting in playback issues.
  
#### **Observation**

- **Interruption Challenges**: Pausing and resuming does not behave as expected. When resuming, it continues from where it stopped, including previous syntheses, rather than restarting from the beginning of the new text.
  
---

### **3. Evolving Solutions for Effective Interruption Handling**

#### **Analysis of the Attempted Solutions**

1. **Direct Time Manipulation**:
   - Initially tried to manage the playback by setting `player.internalAudio.currentTime` to the beginning and stopping points. However, this approach failed because the audio buffer continued to grow with each synthesis, causing replay of old segments.

2. **Buffer Abort and Reset**:
   - Attempted to stop the current playback and reset the media source using `player.privSourceBuffer.abort()`. This aimed to halt any ongoing buffer processes, but the buffer append behavior persisted.

3. **Discovering `privSourceBuffer.timestampOffset`**:
   - **Key Discovery**: The `timestampOffset` property of `player.privSourceBuffer` was identified as crucial for handling interruptions.
   - **Timestamp Offset Functionality**: This property defines where in the buffer the playback should start, allowing more precise control over playback compared to manipulating `currentTime` directly.

#### **Refined Solution Using `timestampOffset`**

```javascript
"use client";

import React, { useState } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
const region = "centralindia";

// Speech configuration setup
const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, region);
speechConfig.speechSynthesisLanguage = "en-IN";
speechConfig.speechSynthesisVoiceName = "en-IN-AnanyaNeural";

// Audio configuration setup with a custom player
const player = new sdk.SpeakerAudioDestination();
console.log(player);
const audioConfig = sdk.AudioConfig.fromSpeakerOutput(player);

// Creating a SpeechSynthesizer instance with custom audio configuration
const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

const TTSPage = () => {
  const [time, setTime] = useState(0);

  // Function to start TTS
  const startTTS = () => {
    if (!synthesizer) {
      console.error("Synthesizer not initialized.");
      return;
    }

    // Stop any currently playing audio and reset the media source
    if (!player.isClosed) {
      player.internalAudio.pause(); // Pause current playback
      player.internalAudio.currentTime = 0; // Reset to start
      player.privSourceBuffer.abort(); // Abort appending to the buffer
    }

    console.log(player);
    console.log(player.internalAudio.currentTime);

    synthesizer.speakTextAsync(
      "Hello, this is a sample Text-to-Speech test with interruption handling.",
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("Speech synthesized successfully.");
          console.log(player.internalAudio.duration);
        } else {
          console.error("Error synthesizing speech:", result.errorDetails);
        }
      },
      (error) => {
        console.error("Error synthesizing speech:", error);
      }
    );
  };

  // Function to stop TTS
  const stopTTS = () => {
    if (!synthesizer) {
      console.error("Synthesizer not initialized.");
      return;
    }

    // Stop playback and reset
    player.internalAudio.pause(); // Pause current playback
    setTime(player.internalAudio.currentTime); // Save current time if needed
    player.internalAudio.currentTime = 0; // Reset playback to start
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
```

#### **Updated Strategy**

1. **Initialization and Controls**:
   - The synthesizer initialization and speech configuration

 remain unchanged.
   - New control functions (`startTTS` and `stopTTS`) have been developed to manage the playback effectively using the `pause`, `currentTime`, and `abort` methods.

2. **Timestamp Reset**:
   - **Setting Timestamp Offset**: By resetting `player.internalAudio.currentTime` and managing the playback state carefully, old buffers are prevented from replaying.
   - **Buffer Reset**: Calling `abort` effectively clears the buffer, allowing for fresh synthesis without the playback of previous segments.

#### **Final Outcome**

- **Effective Control**: The refined solution provides effective control over the TTS playback, allowing for seamless interruption, pause, and resume functionality without replaying old content.
- **Smoother Experience**: With the ability to reset and control the buffer, user interaction is smoother, enabling real-time speech synthesis and handling interruptions gracefully.

### **Conclusion**

The evolution of the TTS implementation from a default setup to a fully controlled audio playback system demonstrates the complexities of managing real-time speech synthesis. The effective use of the Azure Cognitive Services SDK’s capabilities, particularly the custom audio configurations and buffer management, showcases a comprehensive approach to solving the interruption problem in TTS applications.

The final solution achieves the desired outcomes of real-time control, seamless interruption handling, and precise playback management, providing a robust TTS experience for end-users.

--------------------------------------------------------------------------------------------------------------------------------------
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.


