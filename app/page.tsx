import type { ReactElement } from 'react';

import { FeaturesSection } from '@/components/sections/features-section';
import { GettingStartedSection } from '@/components/sections/getting-started-section';
import { HeroSection } from '@/components/sections/hero-section';
import { TechStackSection } from '@/components/sections/tech-stack-section';
import { ToolingSection } from '@/components/sections/tooling-section';

export default function Home(): ReactElement {
    return (
        <div className="flex flex-col gap-20 pb-12">
            <HeroSection />
            <GettingStartedSection />
            <FeaturesSection />
            <TechStackSection />
            <ToolingSection />
        </div>
    );
}
