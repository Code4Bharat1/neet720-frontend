import FeatureResult from '@/components/resultSection/FeatureResult'
import ResultSection from '@/components/resultSection/ResultSection'
import React from 'react'

const Page = () => {
  return (
    <div>
      <ResultSection/>
      <div className="min-h-screen bg-[#103f5d] flex items-center justify-center py-20">
              <FeatureResult/>
            </div>
    </div>
  )
}

export default Page
