'use client';
import Image from 'next/image';
import StarRating from '@/widgets/StarRating/StarRating';
import { useState, useEffect } from 'react';

interface ProductShowcaseProps {
  brand: string;
  title: string;
  description: string[];
  price: {
    current: number;
    currency: string;
  };
  code: string;
  rating: number;
  size: string[];

  images: {
    main: {
      front: { src: string; alt: string };
      back: { src: string; alt: string };
    };
    gallery: { src: string; alt: string }[];
    colors: { src: string; alt: string }[];
  };

  link: {
    href: string;
    label: string;
  };
}

const INFO_TABS = [
  { id: 'materials', label: 'Materials and design details' },
  { id: 'measurements', label: 'Measurements' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'shipping', label: 'Shipping and returns' },
];

export default function ProductShowcase({
  brand,
  title,
  description,
  price,
  code,
  rating,
  images,
  size,
}: ProductShowcaseProps) {
  const [currentSize, setCurrentSize] = useState<number>();
  const [currentColor, setCurrentColor] = useState<number>();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleOpenSidebar = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleCloseSidebar = () => {
    setActiveTab(null);
  };

  useEffect(() => {
    if (!activeTab) {
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [activeTab]);

  return (
    <div className="mb-[10%] flex">
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center">
          <div>
            <Image
              src={images.main.front.src}
              alt={images.main.front.alt}
              width={310}
              height={531}
            />
          </div>
          <div>
            <Image src={images.main.back.src} alt={images.main.back.alt} width={310} height={531} />
          </div>
        </div>

        <div className="flex flex-1 items-center">
          {images.gallery.map((item, key) => (
            <Image key={key} src={item.src} alt={item.alt} width={145} height={208} />
          ))}
        </div>
      </div>

      <div className="ml-[13%] flex flex-1 flex-col">
        <h2>{brand}</h2>
        <div className="flex justify-start gap-[50%]">
          <h1>{title}</h1>
          <div>
            {price.current} {price.currency}
          </div>
        </div>
        <div>
          {description.map((item, key) => (
            <ul className="max-w-[50%]" key={key}>
              {item}
            </ul>
          ))}
        </div>
        <ul style={{ marginTop: 10 }}>Product-code:{code}</ul>
        <div className="my-[3%]">
          <StarRating count={rating} />
        </div>
        <div className="my-[3%] flex flex-row gap-[1%]">
          {size.map((item, key) => (
            <button
              key={key}
              onClick={() => setCurrentSize(key)}
              className={`w-[10%] rounded-lg border border-[#666666] p-[2%] ${
                key === currentSize ? 'bg-dark text-white-fa' : ''
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        Color
        <div className="flex flex-row">
          {images.colors.map((item, key) => (
            <Image
              key={key}
              src={item.src}
              alt={item.alt}
              width={152}
              height={168}
              onClick={() => setCurrentColor(key)}
              className={key === currentColor ? 'border-b border-dark' : ''}
            />
          ))}
        </div>
        <div className="my-[3%] flex flex-row gap-[3%]">
          <button className="border border-[#666666] bg-dark p-[2%_10%] text-white-fa">
            Buy now
          </button>
          <button className="border border-[#666666] p-[2%_10%]">Add to cart</button>
        </div>
        <div className="flex flex-col gap-[4%]">
          {INFO_TABS.map((tab) => (
            <div
              key={tab.id}
              className="flex max-w-[50%] cursor-pointer justify-between border-b border-transparent py-2 transition-[border-color] duration-200 hover:border-dark"
              onClick={() => handleOpenSidebar(tab.id)}
            >
              {tab.label} <span>{'>'}</span>
            </div>
          ))}
        </div>
      </div>

      {activeTab && (
        <>
          <div
            className="fixed top-0 left-0 z-9998 h-screen w-screen bg-black/15 backdrop-blur-lg"
            onClick={handleCloseSidebar}
          />

          <div className="animate-slide-in-right fixed top-0 right-0 z-9999 box-border flex h-screen w-112.5 max-w-screen flex-col bg-white p-10 shadow-[-4px_0_24px_rgb(0_0_0/10%)]">
            <div className="mb-10 flex items-center justify-between">
              <h3 className="text-xl font-medium">{title}</h3>
              <button
                className="cursor-pointer border-none bg-transparent p-1.25 text-2xl text-dark"
                onClick={handleCloseSidebar}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col">
              {INFO_TABS.map((tab) => (
                <div key={tab.id} className="border-b border-[#e5e5e5] py-5">
                  <div className="flex cursor-pointer justify-between text-base font-medium">
                    {tab.label}
                    <span>{activeTab === tab.id ? '✕' : '⌵'}</span>
                  </div>
                  {activeTab === tab.id && (
                    <div className="mt-3.75 text-sm leading-normal text-[#666666]">
                      <p>
                        Detailed information about {tab.label.toLowerCase()} goes here. Crafted from
                        premium materials designed for comfort and durability.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
