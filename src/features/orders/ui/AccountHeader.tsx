'use client';

import Link from 'next/link';
import {
  HiOutlineUser,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiOutlineMapPin,
  HiOutlineKey,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';

type AccountTab = 'profile' | 'favorites' | 'orders' | 'addresses' | 'password' | 'logout';

const tabs: {
  id: AccountTab;
  label: string;
  href: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: <HiOutlineUser className="h-6 w-6" />,
  },
  {
    id: 'favorites',
    label: 'Favorites',
    href: '/favorites',
    icon: <HiOutlineHeart className="h-6 w-6" />,
  },
  {
    id: 'orders',
    label: 'My orders',
    href: '/orders',
    icon: <HiOutlineShoppingBag className="h-6 w-6" />,
  },
  {
    id: 'addresses',
    label: 'Addresses',
    href: '/addresses',
    icon: <HiOutlineMapPin className="h-6 w-6" />,
  },
  {
    id: 'password',
    label: 'Change password',
    href: '/change-password',
    icon: <HiOutlineKey className="h-6 w-6" />,
  },
  {
    id: 'logout',
    label: 'Log out',
    href: '/login',
    icon: <HiOutlineArrowRightOnRectangle className="h-6 w-6" />,
  },
];

type AccountHeaderProps = {
  activeTab: AccountTab;
  userName?: string;
};

export default function AccountHeader({ activeTab, userName = 'John Smith' }: AccountHeaderProps) {
  return (
    <header className="border-y border-black">
      <div className="flex min-h-[15vh] items-center gap-3 py-4">
        <div className="mr-[3%] shrink-0">
          <p className="text-base">Hello</p>
          <p className="text-[32px] font-bold leading-tight">{userName}</p>
        </div>

        <nav className="ml-auto flex flex-wrap items-center gap-3 justify-end">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg border border-black px-3 py-2 text-base transition-colors ${
                  isActive ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
