'use client'
import React from 'react';
import TestInterface from '@/components/testinterface/testinterface';
import TestInterfaceMobile from "@/components/testInterfaceMobileView/testInterface"

const Page = () => {
  return (
    <div>
      {/* Desktop View (TestInterface will be visible) */}
      <div className="block">
        <TestInterface />
      </div>

      {/* Mobile View (TestInterfaceMobile will be visible) */}
      {/* <div className="block md:hidden">
        <TestInterfaceMobile/>
      </div> */}
    </div>
  );
}

export default Page;
