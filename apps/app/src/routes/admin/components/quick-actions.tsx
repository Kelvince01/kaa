import { Calendar, DollarSign, Home, Settings, Users } from "lucide-react";
import Link from "next/link";

export const QuickActions = () => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="mb-4 font-medium text-gray-900 text-lg">Quick Actions</h3>

    <div className="space-y-3">
      <Link
        className="flex items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
        href="/admin/users"
      >
        <div className="mr-3 rounded-full bg-blue-100 p-2 text-blue-600">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">User Management</p>
          <p className="text-gray-500 text-sm">Manage users and roles</p>
        </div>
      </Link>

      <Link
        className="flex items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
        href="/admin/properties"
      >
        <div className="mr-3 rounded-full bg-green-100 p-2 text-green-600">
          <Home className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">Property Management</p>
          <p className="text-gray-500 text-sm">Review and manage listings</p>
        </div>
      </Link>

      <Link
        className="flex items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
        href="/admin/bookings"
      >
        <div className="mr-3 rounded-full bg-purple-100 p-2 text-purple-600">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">Booking Management</p>
          <p className="text-gray-500 text-sm">Monitor booking activity</p>
        </div>
      </Link>

      <Link
        className="flex items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
        href="/admin/finances"
      >
        <div className="mr-3 rounded-full bg-yellow-100 p-2 text-yellow-600">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">Financial Reports</p>
          <p className="text-gray-500 text-sm">Review platform revenue</p>
        </div>
      </Link>

      <Link
        className="flex items-center rounded-lg p-3 transition-colors hover:bg-gray-50"
        href="/admin/settings"
      >
        <div className="mr-3 rounded-full bg-gray-100 p-2 text-gray-600">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">Platform Settings</p>
          <p className="text-gray-500 text-sm">Configure platform settings</p>
        </div>
      </Link>
    </div>
  </div>
);
