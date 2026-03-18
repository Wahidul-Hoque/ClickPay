import React, { useState, useEffect, useRef } from 'react';

const WheelScroll = ({ items, value, onChange }: { items: any[], value: any, onChange: (v: any) => void }) => {
  const itemHeight = 40;
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    if (containerRef.current) {
      const index = items.indexOf(value);
      if (index !== -1) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }
  }, []);

  const handleScroll = (e: any) => {
    if (isScrolling.current) return;
    const scrollTop = e.target.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    if (index >= 0 && index < items.length) {
      if (items[index] !== value) {
        onChange(items[index]);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-[120px] overflow-y-auto scroll-smooth snap-y snap-mandatory relative"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      onScroll={handleScroll}
    >
      <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />
      <div className="h-[40px] shrink-0"></div>
      {items.map((item, i) => (
        <div
          key={i}
          className={`h-[40px] flex items-center justify-center snap-center cursor-pointer transition-colors text-lg ${item === value ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}`}
          onClick={() => {
            isScrolling.current = true;
            if (containerRef.current) containerRef.current.scrollTop = i * itemHeight;
            onChange(item);
            setTimeout(() => isScrolling.current = false, 300);
          }}
        >
          {typeof item === 'number' && item < 32 ? String(item).padStart(2, '0') : item}
        </div>
      ))}
      <div className="h-[40px] shrink-0"></div>
    </div>
  );
};

export const DatePickerDialog = ({ isOpen, initDate, onCancel, onOk, targetName, theme = 'emerald' }: any) => {
  const [day, setDay] = useState(initDate ? parseInt(initDate.split('-')[2]) : new Date().getDate());
  const [monthOffset, setMonthOffset] = useState(initDate ? parseInt(initDate.split('-')[1]) - 1 : new Date().getMonth());
  const [year, setYear] = useState(initDate ? parseInt(initDate.split('-')[0]) : new Date().getFullYear());

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 30 }, (_, i) => 2015 + i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleOk = () => {
    const mm = String(monthOffset + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const yyyy = year;
    onOk(`${yyyy}-${mm}-${dd}`, targetName);
  };

  const isIndigo = theme === 'indigo';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 shadow-2xl backdrop-blur-sm animate-fadeIn">
      <div className="bg-white shadow-2xl rounded-2xl w-[320px] flex flex-col pt-4 overflow-hidden border border-slate-200">
        <div className="px-6 py-4">
          <div className="relative h-[120px]">
            <div className={`absolute top-1/2 left-0 right-0 h-[40px] -mt-[20px] border-y-2 pointer-events-none z-10 ${isIndigo ? 'border-indigo-500 bg-indigo-50/30' : 'border-emerald-500 bg-emerald-50/30'}`}></div>

            <div className="flex justify-between items-center text-center">
              <div className="flex-1 overflow-hidden">
                <WheelScroll items={days} value={day} onChange={setDay} />
              </div>
              <div className="flex-1 overflow-hidden">
                <WheelScroll items={months} value={months[monthOffset]} onChange={(val: string) => setMonthOffset(months.indexOf(val))} />
              </div>
              <div className="flex-1 overflow-hidden">
                <WheelScroll items={years} value={year} onChange={setYear} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex border-t border-slate-200 mt-2 bg-slate-50">
          <button onClick={onCancel} className="flex-1 py-4 text-slate-500 hover:text-slate-700 hover:bg-slate-100 uppercase text-sm font-bold transition-colors">Cancel</button>
          <div className="w-px bg-slate-200"></div>
          <button onClick={handleOk} className={`flex-1 py-4 uppercase text-sm font-bold transition-colors ${isIndigo ? 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/80' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/80'}`}>OK</button>
        </div>
      </div>
    </div>
  );
};
