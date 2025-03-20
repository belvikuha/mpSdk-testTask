"use client";
import {useEffect, useRef} from "react";

// import {MpSdk} from "@matterport/sdk";

export default function MatterportPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // const [mpSdk, setMpSdk] = useState();

  const onLoad = async () => {
    let mpSdk;
    const showcaseWindow = iframeRef?.current?.contentWindow;
    try {
      mpSdk = await showcaseWindow?.MP_SDK.connect(showcaseWindow);
      // setMpSdk(mpSdk);
    } catch (e) {
      console.error(e);
      return;
    }
    console.log("Hello Bundle SDK", mpSdk);
  };

  useEffect(() => {
    onLoad();
  }, []);

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
