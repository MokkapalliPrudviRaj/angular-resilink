import { Issue, Staff, IssueCategory } from '../models';

// Default ETA for any unknown category
const defaultETA = '3-5 business days';

// ETA based on category (in business days)
export const categoryETAs: Record<string, string> = {
  general: '3-5 business days',
  electrical: '1-2 business days',
  water: '1-2 business days',
  gas: '1 business day',
  heating: '1-3 business days',
  cooling: '1-3 business days',
  appliances: '3-5 business days',
  furniture: '5-7 business days',
  kitchen: '3-5 business days',
  bathroom: '2-4 business days',
  'living room': '3-5 business days',
  bedroom: '3-5 business days',
  office: '3-5 business days',
  garage: '3-5 business days',
  basement: '3-5 business days',
  attic: '3-5 business days',
  storage: '3-5 business days',
  barn: '5-7 business days',
  carpet: '5-7 business days',
  floor: '5-7 business days',
  ceiling: '5-7 business days',
  shelves: '3-5 business days',
  cabinets: '3-5 business days',
  bookcases: '3-5 business days',
  // Backwards compatibility for mock data currently active
  plumbing: '2-3 business days',
  hvac: '3-5 business days',
  appliance: '3-5 business days',
  structural: '5-7 business days',
  pest: '1-2 business days',
  other: '3-5 business days'
};

export const categoryLabels: Record<string, string> = {
  general: 'General',
  electrical: 'Electrical',
  water: 'Water',
  gas: 'Gas',
  heating: 'Heating',
  cooling: 'Cooling',
  appliances: 'Appliances',
  furniture: 'Furniture',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  'living room': 'Living Room',
  bedroom: 'Bedroom',
  office: 'Office',
  garage: 'Garage',
  basement: 'Basement',
  attic: 'Attic',
  storage: 'Storage',
  barn: 'Barn',
  carpet: 'Carpet',
  floor: 'Floor',
  ceiling: 'Ceiling',
  shelves: 'Shelves',
  cabinets: 'Cabinets',
  bookcases: 'Bookcases',
  // Backwards compatibility for mock data currently active
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  appliance: 'Appliance',
  structural: 'Structural',
  pest: 'Pest Control',
  other: 'Other'
};

export const mockStaff: Staff[] = [
  {
    id: 'staff-1',
    name: 'Mike Johnson',
    role: 'Plumber',
    email: 'mike.j@maintenance.com',
    phone: '+1234567892',
    activeIssues: 3
  },
  {
    id: 'staff-2',
    name: 'Sarah Williams',
    role: 'Electrician',
    email: 'sarah.w@maintenance.com',
    phone: '+1234567893',
    activeIssues: 2
  },
  {
    id: 'staff-3',
    name: 'David Martinez',
    role: 'HVAC Technician',
    email: 'david.m@maintenance.com',
    phone: '+1234567894',
    activeIssues: 4
  },
  {
    id: 'staff-4',
    name: 'Emily Chen',
    role: 'General Maintenance',
    email: 'emily.c@maintenance.com',
    phone: '+1234567895',
    activeIssues: 1
  }
];

export const mockIssues: Issue[] = [
  {
    id: 'issue-1',
    title: 'Leaking Kitchen Faucet',
    description: 'The kitchen faucet has been leaking for the past two days. Water drips constantly even when turned off completely.',
    category: 'plumbing',
    status: 'in-progress',
    statusId: 2,
    priority: 'high',
    createdAt: '2026-02-19T10:30:00Z',
    updatedAt: '2026-02-20T14:20:00Z',
    eta: categoryETAs['plumbing'],
    assignedTo: 'staff-1',
    residentId: 'resident-1',
    residentName: 'John Resident',
    apartment: 'Apt 204',
    images: [],
    notes: [],
    comments: [
      {
        id: 'comment-1',
        userId: 'admin-1',
        userName: 'Admin User',
        userRole: 'admin',
        text: 'Assigned to Mike. He will visit tomorrow morning.',
        createdAt: '2026-02-20T14:20:00Z'
      }
    ]
  },
  {
    id: 'issue-2',
    title: 'Living Room Light Not Working',
    description: 'The main ceiling light in the living room suddenly stopped working. I replaced the bulb but it still does not turn on.',
    category: 'electrical',
    status: 'open',
    statusId: 1,
    priority: 'medium',
    createdAt: '2026-02-20T08:15:00Z',
    updatedAt: '2026-02-20T08:15:00Z',
    eta: categoryETAs['electrical'],
    residentId: 'resident-2',
    residentName: 'Emma Davis',
    apartment: 'Apt 312',
    images: [],
    notes: [],
    comments: []
  },
  {
    id: 'issue-3',
    title: 'AC Not Cooling Properly',
    description: 'The air conditioning unit is running but not cooling the apartment adequately. Temperature stays around 78°F even when set to 68°F.',
    category: 'hvac',
    status: 'open',
    statusId: 1,
    priority: 'urgent',
    createdAt: '2026-02-21T06:45:00Z',
    updatedAt: '2026-02-21T06:45:00Z',
    eta: categoryETAs['hvac'],
    residentId: 'resident-3',
    residentName: 'Michael Brown',
    apartment: 'Apt 156',
    images: [],
    notes: [],
    comments: []
  },
  {
    id: 'issue-4',
    title: 'Refrigerator Making Loud Noise',
    description: 'The refrigerator has started making a loud buzzing noise, especially at night. It is still cooling but the noise is very disturbing.',
    category: 'appliance',
    status: 'resolved',
    statusId: 3,
    priority: 'low',
    createdAt: '2026-02-15T16:20:00Z',
    updatedAt: '2026-02-18T11:30:00Z',
    eta: categoryETAs['appliance'],
    assignedTo: 'staff-4',
    residentId: 'resident-1',
    residentName: 'John Resident',
    apartment: 'Apt 204',
    images: [],
    notes: [],
    comments: [
      {
        id: 'comment-2',
        userId: 'staff-4',
        userName: 'Emily Chen',
        userRole: 'admin',
        text: 'Fixed. The compressor fan was loose. Tightened and tested.',
        createdAt: '2026-02-18T11:30:00Z'
      }
    ]
  },
  {
    id: 'issue-5',
    title: 'Lobby Elevator Out of Service',
    description: 'The main lobby elevator has been out of service since this morning. Display shows "Error 503".',
    category: 'structural',
    status: 'in-progress',
    statusId: 2,
    priority: 'urgent',
    createdAt: '2026-02-21T07:00:00Z',
    updatedAt: '2026-02-21T08:30:00Z',
    eta: categoryETAs['structural'],
    assignedTo: 'staff-3',
    residentId: 'resident-4',
    residentName: 'Lisa Anderson',
    apartment: 'Apt 501',
    images: [],
    notes: [],
    comments: [
      {
        id: 'comment-3',
        userId: 'admin-1',
        userName: 'Admin User',
        userRole: 'admin',
        text: 'Elevator company has been notified. Technician arriving at 10 AM.',
        createdAt: '2026-02-21T08:30:00Z'
      }
    ],
    isCommonArea: true
  },
  {
    id: 'issue-6',
    title: 'Bathroom Sink Clogged',
    description: 'Bathroom sink is draining very slowly. Water pools up when washing hands.',
    category: 'plumbing',
    status: 'open',
    statusId: 1,
    priority: 'medium',
    createdAt: '2026-02-20T19:30:00Z',
    updatedAt: '2026-02-20T19:30:00Z',
    eta: categoryETAs['plumbing'],
    residentId: 'resident-5',
    residentName: 'James Wilson',
    apartment: 'Apt 108',
    images: [],
    notes: [],
    comments: []
  },
  {
    id: 'issue-7',
    title: 'Window Screen Torn',
    description: 'The screen on the bedroom window is torn and needs replacement. Bugs are getting in.',
    category: 'other',
    status: 'closed',
    statusId: 4,
    priority: 'low',
    createdAt: '2026-02-10T13:00:00Z',
    updatedAt: '2026-02-17T10:15:00Z',
    eta: categoryETAs['other'],
    assignedTo: 'staff-4',
    residentId: 'resident-1',
    residentName: 'John Resident',
    apartment: 'Apt 204',
    images: [],
    notes: [],
    comments: [
      {
        id: 'comment-4',
        userId: 'staff-4',
        userName: 'Emily Chen',
        userRole: 'admin',
        text: 'Screen replaced. Checked all other windows - all good.',
        createdAt: '2026-02-17T10:15:00Z'
      }
    ]
  },
  {
    id: 'issue-8',
    title: 'Pest Control Needed',
    description: 'Noticed several cockroaches in the kitchen area. Need pest control service urgently.',
    category: 'pest',
    status: 'in-progress',
    statusId: 2,
    priority: 'high',
    createdAt: '2026-02-20T21:00:00Z',
    updatedAt: '2026-02-21T07:30:00Z',
    eta: categoryETAs['pest'],
    assignedTo: 'staff-4',
    residentId: 'resident-6',
    residentName: 'Maria Garcia',
    apartment: 'Apt 225',
    images: [],
    notes: [],
    comments: [
      {
        id: 'comment-5',
        userId: 'admin-1',
        userName: 'Admin User',
        userRole: 'admin',
        text: 'Pest control company scheduled for today at 2 PM.',
        createdAt: '2026-02-21T07:30:00Z'
      }
    ]
  }
];
