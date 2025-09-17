const stats = [
  {
    value: "10,000+",
    label: "Properties Managed",
  },
  {
    value: "95%",
    label: "Rent Collection Rate",
  },
  {
    value: "47",
    label: "Counties Covered",
  },
  {
    value: "98%",
    label: "Tenant Satisfaction",
  },
  {
    value: "24/7",
    label: "AI Support",
  },
];

export function StatsSection() {
  return (
    <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-20">
      <div className="container mx-auto">
        <div className="grid gap-8 text-center md:grid-cols-5">
          {stats.map((stat) => (
            <div className="space-y-2" key={stat.label}>
              <div className="font-bold text-4xl text-white">{stat.value}</div>
              <div className="text-emerald-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
