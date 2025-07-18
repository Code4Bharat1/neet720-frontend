"use client";
import React from "react";
import TestInterface_plan from "@/components/testinterface/testinterface_plan";
import TestInterfaceMobile from "@/components/testinterfacemobile/testinterfacemobile";
import TestInterface from '@/components/testInterfaceMobileView/testInterface_plan'

const Page = () => {
  return (
    <div>
      {/* Desktop View (TestInterface will be visible) */}
      <div className="hidden md:block">
        <TestInterface_plan />
      </div>

      {/* Mobile View (TestInterfaceMobile will be visible) */}
      <div className="block md:hidden">
        <TestInterface />
      </div>
    </div>
  );
};

export default Page;
