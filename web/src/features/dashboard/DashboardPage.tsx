export default function DashboardPage() {
  return (
    <div className="animate-fade-up">
      <div className="pb-5 border-b border-rule mb-7">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-rust mb-2">
          วันพุธที่ 29 เมษายน 2569
        </div>
        <h1 className="font-display text-[34px] font-medium leading-tight">
          สวัสดี — <em className="font-serif italic font-normal text-rust">วันนี้ที่ร้าน</em>
        </h1>
        <p className="mt-2 text-mute text-sm max-w-xl">
          ภาพรวมการดำเนินงานของ บริษัท เอส.อรัญ ออยล์ แอนด์ ออโต้พาร์ท จำกัด
        </p>
      </div>

      <div className="grid grid-cols-4 bg-white border border-rule rounded-xl overflow-hidden mb-6 shadow-sm">
        {[
          { label: 'ยอดขายวันนี้', value: '฿487,250', delta: '↑ 12.4%', up: true },
          { label: 'ออเดอร์ใหม่', value: '142', delta: '↑ 8', up: true },
          { label: 'สินค้าคงคลัง', value: '2,874', delta: '−3', up: false },
          { label: 'ลูกหนี้คงค้าง', value: '฿289,420', delta: '−฿4,200', up: false },
        ].map((k, i) => (
          <div key={i} className={`p-6 ${i < 3 ? 'border-r border-rule' : ''}`}>
            <div className="flex items-center justify-between mb-3.5 font-mono text-[10px] tracking-wider uppercase text-mute">
              <span>{k.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${k.up ? 'bg-green-50 text-green-700' : 'bg-burgundy-soft text-burgundy'}`}>
                {k.delta}
              </span>
            </div>
            <div className="editorial-num text-[42px] mb-1.5 text-ink">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-rule rounded-xl p-12 text-center">
        <div className="font-display font-medium text-xl mb-2">
          🚧 Day 1 Setup — Foundation Complete
        </div>
        <p className="text-mute text-sm max-w-md mx-auto">
          API + React scaffolded. Modules (Inventory, Purchase, Sales, Admin) will be built in Phase 2.
        </p>
      </div>
    </div>
  );
}
