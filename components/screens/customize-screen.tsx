"use client";

import { useState } from "react";
import { ActionLink, BackLink, Button } from "@/components/ui/controls";
import { Panel } from "@/components/ui/panel";
import { Icon } from "@/components/ui/icon";
import { Sticker } from "@/components/artwork/sticker";
import { PhotoStrip } from "@/components/photobooth/photo-strip";
import { FramePicker } from "@/components/photobooth/frame-picker";
import { sampleComposition } from "@/lib/composition";
import { FRAME_COLORS, FRAME_STYLES, STICKERS } from "@/lib/design-data";

export function CustomizeScreen() {
  const [color, setColor] = useState<string>("#1D1812");
  const [frame, setFrame] = useState(0);
  const composition = sampleComposition({ frameColor: color, frameStyle: FRAME_STYLES[frame].id });

  return <Panel className="workspace-panel customize-panel" labelledBy="customize-title">
    <header className="panel-heading customize-heading"><BackLink href="/capture" label="Back to capture preview" /><h1 id="customize-title">Customize Your Photo</h1><p>Choose a frame. Change Color. Add stickers. Add text.</p></header>
    <FramePicker composition={composition} frameIndex={frame} onChange={setFrame} />
    <div className="customize-tools">
      <fieldset className="color-fieldset"><legend>Frame Color</legend><div className="color-palette">{FRAME_COLORS.map((swatch) => <button key={swatch.name} type="button" className="color-swatch" style={{ backgroundColor: swatch.value }} aria-label={swatch.name} title={swatch.name} aria-pressed={color === swatch.value} onClick={() => setColor(swatch.value)}>{color === swatch.value && <span className="swatch-check"><Icon name="check" /></span>}</button>)}</div></fieldset>
      <fieldset className="sticker-fieldset"><legend>Stickers</legend><div className="sticker-palette">{STICKERS.map((kind) => <button type="button" key={kind} disabled title="Sticker editing is coming in the customization milestone" aria-label={`${kind.replaceAll("-", " ")} sticker (preview only)`}><Sticker kind={kind} /></button>)}</div></fieldset>
      <Button className="add-text" disabled title="Text editing is coming in the customization milestone"><Icon name="text" />Add Text</Button>
    </div>
    <div className="customize-preview"><PhotoStrip composition={composition} /></div>
    <ActionLink href="/print" className="print-action">Print</ActionLink>
  </Panel>;
}
