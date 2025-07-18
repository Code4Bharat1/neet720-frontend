"use client";
export const dynamic = "force-dynamic"
import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import Sidebar from "@/components/layout/sidebar/sidebar";
import NavBar from "@/components/layout/navbar/navbar";
import BottomNavbar from "@/components/layout/bottomnav/bottomnav";
import Hero from "@/components/dashboard/hero";
import ToggleBar from "@/components/layout/togglebar/togglebar";
import Overview from "@/components/overview/overview";
import TargetTrackerCard from "@/components/Analytics/TargetTracker";
import PendingTestCard from "@/components/Analytics/PendingTestCard";
import SubjectStatisticsCard from "@/components/Analytics/SubjectStatisticsCard";
import LastTestResultCard from "@/components/Analytics/LastTestResult";
import UpcomingActivitiesCard from "@/components/Analytics/UpcomingActivitiesCard";
import RecentTestReportCard from "@/components/Analytics/RecentTestReportCard";
import jsPDF from "jspdf";
import Head from "next/head";

const Page = () => {
  const [selectedFilter, setSelectedFilter] = useState("This Year");

  // Reference for capturing only the required section
  const captureRef = useRef(null);

  // Function to capture only the analytics content (excluding Sidebar, Hero, Navbar, etc.)
  const handleDownload = async () => {
    if (captureRef.current) {
      const canvas = await html2canvas(captureRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      // Download as Image
      const link = document.createElement("a");
      link.href = imgData;
      link.download = "analytics_report.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Optionally, download as PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("Analytics_Report.pdf");
    }
  };

  return (
    <>
      <Head>
        <title>NEET720 Analytics - Track NEET Performance</title>
        <meta name="description" content="View NEET scores, tests & performance stats on NEET720's analytics dashboard." />
        <meta name="keywords" content="NEET720 analytics, NEET analytics, NEET performance tracking, NEET subject-wise scores, NEET720 dashboard, NEET progress" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta property="og:title" content="NEET720 Analytics - Track NEET Performance" />
        <meta property="og:description" content="Analyze your NEET scores, tasks, and subject performance with NEET720’s analytics dashboard." />
        <meta property="og:image" content="https://s3.ap-southeast-1.wasabisys.com/neet720/seoImages/AnalyticsPageImage.jpg" />
        <meta property="og:url" content="https://neet720.com/analytics" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NEET720 Analytics - Track NEET Performance" />
        <meta name="twitter:description" content="Track your NEET preparation with subject analytics, tasks, and performance stats on NEET720." />
        <meta name="twitter:image" content="https://s3.ap-southeast-1.wasabisys.com/neet720/seoImages/AnalyticsPageImage.jpg" />
        <link rel="canonical" href="https://neet720.com/analytics" />
      </Head>
      <div className="md:flex min-h-screen relative bg-white">
        {/* Sidebar for md screens (Excluded from Snapshot) */}
        <Sidebar />

        {/* Main Content */}
        <div className="w-full md:w-5/6 flex flex-col">
          {/* Excluded Components */}
          <ToggleBar />
          <NavBar />
          <Hero selectedFilter={selectedFilter} />

          {/* Overview Section (Pass Download Function) */}
          <div className="md:mx-4">
            <Overview
              setSelectedFilter={setSelectedFilter}
              handleDownload={handleDownload}
            />
          </div>

          {/* Snapshot Area Starts Here */}
          <div ref={captureRef} className="bg-white w-full">
            {/* Updated Grid Layout: 3 Columns in Medium Screens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-4 mt-6">
              <TargetTrackerCard selectedFilter={selectedFilter} />
              <PendingTestCard selectedFilter={selectedFilter} />
              <SubjectStatisticsCard selectedFilter={selectedFilter} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-4 mt-6 md:mt-10 pb-28 md:pb-10">
              <RecentTestReportCard />
              <LastTestResultCard />
              <UpcomingActivitiesCard />
            </div>
          </div>
          {/* Snapshot Area Ends Here */}

          {/* Bottom Navbar for mobile screens (Excluded from Snapshot) */}
          <BottomNavbar selectedFilter={selectedFilter} />
        </div>
      </div>
    </>
  );
};

export default Page;
