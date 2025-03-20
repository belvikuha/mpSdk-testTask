import { ShowcaseEmbedWindow } from "@matterport/sdk";

declare global {
  interface Window {
    MP_SDK?: ShowcaseEmbedWindow;
  }
}
export {};
