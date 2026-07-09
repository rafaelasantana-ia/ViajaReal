import { Outlet } from 'react-router-dom';
import { BottomNavigation, SidebarNavigation } from './BottomNavigation';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="app-shell">
      <SidebarNavigation />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="screen">
          <Outlet />
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}
