"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { BrandIdentityPanel } from "@/components/project/panels/BrandIdentityPanel";
import { MarketingPanel } from "@/components/project/panels/MarketingPanel";
import { Model3DPanel } from "@/components/project/panels/Model3DPanel";
import { TrustScorePanel } from "@/components/project/panels/TrustScorePanel";
import { VisualsPanel } from "@/components/project/panels/VisualsPanel";
import { WebsitePanel } from "@/components/project/panels/WebsitePanel";
import type { ProjectTabId } from "@/components/project/ProjectTabs";
import { tabIndex } from "@/components/project/ProjectTabs";
import type { Project, VisualAsset } from "@/types/visora";

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -48 : 48,
    opacity: 0,
  }),
};

interface ProjectTabPanelsProps {
  project: Project;
  activeTab: ProjectTabId;
  onVisualsChange?: (visuals: VisualAsset[]) => void;
}

export function ProjectTabPanels({
  project,
  activeTab,
  onVisualsChange,
}: ProjectTabPanelsProps) {
  const prevTabRef = useRef(activeTab);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const prev = tabIndex(prevTabRef.current);
    const curr = tabIndex(activeTab);
    setDirection(curr >= prev ? 1 : -1);
    prevTabRef.current = activeTab;
  }, [activeTab]);

  return (
    <div className="relative mt-6 min-h-[320px] overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeTab}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {activeTab === "brand" ? (
            <BrandIdentityPanel brand={project.brandResult} />
          ) : null}
          {activeTab === "visuals" ? (
            <VisualsPanel
              visuals={project.visuals ?? []}
              onVisualsChange={onVisualsChange}
            />
          ) : null}
          {activeTab === "model3d" ? (
            <Model3DPanel model={project.model3d} />
          ) : null}
          {activeTab === "website" ? (
            <WebsitePanel
              concept={project.websiteConcept}
              brand={project.brandResult}
            />
          ) : null}
          {activeTab === "marketing" ? (
            <MarketingPanel pack={project.marketingPack} />
          ) : null}
          {activeTab === "trust" ? (
            <TrustScorePanel data={project.trustScore} />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
