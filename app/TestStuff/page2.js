'use client';
const fs = require('fs');
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

const subscriptionKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
const serviceRegion = "centralindia"; // e.g., "eastus"

const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural'; // Set your preferred voice

const audioConfig = sdk.AudioConfig.fromAudioFileOutput('output.wav'); // Save to 'output.wav'

const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

const text = 'Hello, this is a test synthesis using Azure Speech SDK.';

export default function TestPage() {
    const synthesizeText = () => {
        synthesizer.speakTextAsync(text, result => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                console.log('Synthesis finished.');
            } else {
                console.error('Synthesis failed:', result.errorDetails);
            }
            synthesizer.close();
        }, error => {
            console.error('Error:', error);
            synthesizer.close();
        });
    };
    return (
        <div>
            <h1>Test Page</h1>
            <button onClick={() => synthesizeText()}>
                Synthesize Text
            </button>
        </div>
    );
}