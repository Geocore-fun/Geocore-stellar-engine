/**
 * Push a complete set of scene parameters into a pipeline's layers and passes.
 *
 * The single mapping from store-shaped parameters to the GPU side. The live
 * preview, single export, batch export and its restore all route through here,
 * so a layer whose enable rule changes is changed in one place.
 */

import type { SceneParams } from '@/state/appStore';
import type { SkyboxPipeline } from './SkyboxPipeline';

export function applySceneParams(pipeline: SkyboxPipeline, scene: SceneParams): void {
  const {
    faceSize,
    backgroundColor,
    starField,
    catalogStars,
    constellations,
    constellationBoundaries,
    milkyWay,
    nebula,
    sun,
    bloom,
    lensFlare,
    godRays,
  } = scene;

  pipeline.setFaceSize(faceSize);

  setLayer(pipeline, 'background', true, { color: backgroundColor });

  // In 'replace' mode the real catalogue stands in for the procedural stars.
  setLayer(
    pipeline,
    'point-stars',
    starField.enabled && !(catalogStars.enabled && catalogStars.blendMode === 'replace'),
    { ...starField },
  );

  setLayer(pipeline, 'catalog-stars', catalogStars.enabled, { ...catalogStars });
  setLayer(pipeline, 'named-star-labels', catalogStars.enabled && catalogStars.showLabels, {
    enabled: catalogStars.showLabels,
    opacity: catalogStars.labelOpacity,
    color: catalogStars.labelColor,
    scale: catalogStars.labelScale,
    magnitudeLimit: catalogStars.labelMagnitudeLimit,
  });

  setLayer(pipeline, 'constellations', constellations.enabled, { ...constellations });
  setLayer(pipeline, 'constellation-labels', constellations.enabled && constellations.showLabels, {
    enabled: constellations.showLabels,
    opacity: constellations.labelOpacity,
    color: constellations.labelColor,
    scale: constellations.labelScale,
    visibleConstellations: constellations.visibleConstellations,
  });
  setLayer(pipeline, 'constellation-boundaries', constellationBoundaries.enabled, {
    ...constellationBoundaries,
  });

  setLayer(pipeline, 'milky-way', milkyWay.enabled, { ...milkyWay });
  setLayer(pipeline, 'nebula', nebula.enabled, { ...nebula });
  setLayer(pipeline, 'sun', sun.enabled, { ...sun });

  pipeline.setBloomParams(bloom);
  pipeline.setLensFlareParams(lensFlare);
  pipeline.setGodRayParams(godRays);
  pipeline.setSunPosition(sun.position);
}

function setLayer(
  pipeline: SkyboxPipeline,
  id: string,
  enabled: boolean,
  params: Record<string, unknown>,
): void {
  const layer = pipeline.getLayer(id);
  if (!layer) return;
  layer.updateParams(params);
  layer.enabled = enabled;
}
