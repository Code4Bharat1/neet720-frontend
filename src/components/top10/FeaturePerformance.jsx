import Image from "next/image";

const features = [
  {
    title: "Real-Time Leaderboard",
    description: "Rankings update instantly after every test",
    image: "/top1.png", // Replace with actual image path
  },
  {
    title: "Motivation Through Recognition",
    description: "Top scorers are acknowledged and appreciated",
    image: "/top2.png",
  },
  {
    title: "Push Beyond Limits",
    description: "Competition inspires consistent improvement",
    image: "/top3.png",
  },
  {
    title: "Build Exam Pressure Endurance",
    description: "Competing regularly sharpens focus and control",
    image: "/top4.png",
  },
];

export default function FeaturesPerformance() {
  return (
    <section className="bg-gradient-to-br from-[#0f3b63] to-[#079ba1] rounded-[40px] py-16 px-6 md:px-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-block bg-[#029fa5] text-white px-6 py-2 rounded-full font-semibold text-lg shadow-md">
          Features
        </div>
      </div>

      {/* Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-y-16 gap-x-10">
  {features.map((feature, index) => (
    <div
      key={index}
      className="bg-[#129ea0] relative rounded-[48px] border-r-white text-white pt-16 pb-8 px-6 text-center border border-white/50 shadow-md"
    >
      {/* Profile Image */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
          <img
            src={feature.image}
            alt="User"
            width={80}
            height={80}
            className="object-cover w-full h-full"
          />
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="font-bold text-[18px]">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed">{feature.description}</p>
    </div>
  ))}
</div>

    </section>
  );
}
