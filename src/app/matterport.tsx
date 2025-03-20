"use client";
import {useEffect, useRef, useState} from "react";

import {MpSdk} from "@matterport/sdk";

export default function MatterportPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mpSdk, setMpSdk] = useState<MpSdk | null>(null);

  const onLoad = async () => {
    if (!iframeRef.current) return;
    let mpSdk;
    const showcaseWindow = iframeRef?.current?.contentWindow;
    try {
      mpSdk = await showcaseWindow?.MP_SDK.connect(showcaseWindow);
      setMpSdk(mpSdk);
    } catch (e) {
      console.error(e);
      return;
    }
    console.log("Hello Bundle SDK", mpSdk);
  };

  useEffect(() => {
    onLoad();
  }, []);

  useEffect(() => {
    if (!mpSdk) return;

    const addTag = async () => {
      try {
        const tag = await mpSdk.Tag.add({
          label: "Office",
          anchorPosition: {x: 0, y: 1.5, z: 0},
          stemVector: {x: 0, y: 0.3, z: 0}, // Стебель тега
          color: {r: 1.0, g: 0.0, b: 0.0},
        });
        console.log("Тег добавлен:", tag);
      } catch (err) {
        console.error("Ошибка при добавлении тега", err);
      }
    };

    addTag();
  }, [mpSdk]);

  return (
    <div style={{width: "100%", height: "100vh"}} className="tyty">
      <iframe
        id="showcase"
        ref={iframeRef}
        src="/showcase-bundle/showcase.html?m=m72PGKzeknR&applicationKey=295ba0c0f04541318359a8e75af33043"
        style={{width: "100%", height: "100%"}}
      />
    </div>
  );
}
