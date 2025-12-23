/* eslint-disable no-unused-vars */
import React from 'react';
import NewYearOverlay from './overlays/NewYearOverlay';
import ChineseNewYearOverlay from './overlays/ChineseNewYearOverlay';
import ChristmasOverlay from './overlays/ChristmasOverlay';
import WinterOverlay from './overlays/WinterOverlay';
import SummerOverlay from './overlays/SummerOverlay';
import DayNightOverlay from './overlays/DayNightOverlay';
import RainyOverlay from './overlays/RainyOverlay';

const SeasonalOverlay = ({ themeId }) => {
  switch (themeId) {
    case 'newyear': return <NewYearOverlay />;
    case 'chinese': return <ChineseNewYearOverlay />;
    case 'christmas': return <ChristmasOverlay />;
    case 'winter': return <WinterOverlay />;
    case 'summer': return <SummerOverlay />;
    case 'rainy': return <RainyOverlay />;
    case 'day':
    case 'night': return <DayNightOverlay mode={themeId} />;
    default: return null;
  }
};

export default SeasonalOverlay;