'use client'
import React from 'react';
import TestInterfaceMobile from '@/components/testinterfacemobile/testinterfacemobile';
import { Result } from 'postcss';
import ResultPage from '@/components/result/result';
import ResultMobile from '@/components/resultmobile/resultmobile';
import BottomNavbar from '@/components/layout/bottomnav/bottomnav';

const Page = () => {
  return (
    <div>
      {/* Desktop View (TestInterface will be visible) */}
      <div className="block">
        <ResultPage/>
      </div>

      {/* Mobile View (TestInterfaceMobile will be visible) */}
      {/* <div className="block md:hidden">
       <ResultMobile />
        
      </div> */}
      <div className='mt-48'><BottomNavbar/></div>
    </div>
  );
}
export default Page;
