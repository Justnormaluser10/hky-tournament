import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Amreli 1st Hockey 7-Side Tournament Database ---');

  // Clean old data
  await prisma.activityLog.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.knockoutMatch.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.admin.deleteMany();

  // 1. Create Admin
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('AmreliHockey@2026', salt);

  const admin = await prisma.admin.create({
    data: {
      email: 'admin@amrelihockey.com',
      name: 'Amreli Tournament Director',
      passwordHash,
      role: 'SUPERADMIN',
    },
  });
  console.log(`Created Master Admin: ${admin.email}`);

  // 2. Create Tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: 'AMRELI 1st HOCKEY 7-SIDE TOURNAMENT',
      sport: 'Field Hockey — 7-Side',
      location: 'Amreli, Gujarat, India',
      venue: 'Amreli District Sports Complex Ground, Near Sardar Baug, Amreli',
      status: 'LIVE',
      format: 'LEAGUE_KNOCKOUT',
      currentStage: 'LEAGUE',
      qualificationCount: 4,
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      tieBreakerRules: 'Points > Goal Difference > Goals For > Head-to-Head',
      description:
        'The premier 7-side field hockey championship of Saurashtra, bringing together premier hockey clubs and rising talent across Gujarat for the inaugural Amreli Silver Stick Trophy.',
      startDate: new Date('2026-09-18T09:00:00Z'),
      endDate: new Date('2026-09-22T21:00:00Z'),
    },
  });
  console.log(`Created Tournament: ${tournament.name}`);

  // 3. Create Teams
  const teamsData = [
    {
      name: 'Amreli Hockey Club',
      shortName: 'AHC',
      coach: 'Haresh Vala',
      description: 'Host team and three-time Saurashtra invitational champions.',
      primaryColor: '#059669',
      logo: 'ahc-logo',
    },
    {
      name: 'Gir Lions Hockey Academy',
      shortName: 'GLA',
      coach: 'Nilesh Gondaliya',
      description: 'Defending state junior division champions known for aggressive counter-attacks.',
      primaryColor: '#f59e0b',
      logo: 'gla-logo',
    },
    {
      name: 'Saurashtra Strikers',
      shortName: 'SST',
      coach: 'Mansukhbhai Rathod',
      description: 'Veteran lineup featuring experienced penalty corner specialists.',
      primaryColor: '#3b82f6',
      logo: 'sst-logo',
    },
    {
      name: 'Shetrunji Royals',
      shortName: 'SJR',
      coach: 'Pravin Parmar',
      description: 'Dynamic young squad from the banks of Shetrunji river with lethal pace.',
      primaryColor: '#8b5cf6',
      logo: 'sjr-logo',
    },
    {
      name: 'Somnath Dynamos',
      shortName: 'SND',
      coach: 'Jaypalsinh Jadeja',
      description: 'Resilient coastal powerhouse with an impenetrable midfield wall.',
      primaryColor: '#ef4444',
      logo: 'snd-logo',
    },
    {
      name: 'Dhari Warriors',
      shortName: 'DHW',
      coach: 'Bhupat Chavda',
      description: 'Fierce regional contenders celebrated for relentless defensive pressing.',
      primaryColor: '#06b6d4',
      logo: 'dhw-logo',
    },
  ];

  const createdTeams: Record<string, any> = {};

  for (const t of teamsData) {
    const team = await prisma.team.create({
      data: {
        tournamentId: tournament.id,
        name: t.name,
        shortName: t.shortName,
        coach: t.coach,
        description: t.description,
        primaryColor: t.primaryColor,
        logo: t.logo,
      },
    });
    createdTeams[t.shortName] = team;
  }
  console.log(`Created ${Object.keys(createdTeams).length} teams.`);

  // 4. Create Players for each team
  const playersByTeam: Record<string, any[]> = {
    AHC: [
      { name: 'Amit Parmar', jerseyNumber: 1, position: 'GOALKEEPER', isCaptain: false },
      { name: 'Manoj Vaja', jerseyNumber: 3, position: 'DEFENDER', isCaptain: false },
      { name: 'Harsh Zala', jerseyNumber: 4, position: 'DEFENDER', isCaptain: false },
      { name: 'Jay Shah', jerseyNumber: 7, position: 'MIDFIELDER', isCaptain: false },
      { name: 'Divyesh Makwana', jerseyNumber: 8, position: 'MIDFIELDER', isCaptain: false },
      { name: 'Ketan Solanki', jerseyNumber: 9, position: 'FORWARD', isCaptain: false },
      { name: 'Rahul Patel', jerseyNumber: 10, position: 'FORWARD', isCaptain: true }, // ⭐ CAPTAIN
      { name: 'Bhargav Dodiya', jerseyNumber: 11, position: 'UTILITY', isCaptain: false },
      { name: 'Sanjay Rathod', jerseyNumber: 14, position: 'UTILITY', isCaptain: false },
    ],
    GLA: [
      { name: 'Dharmesh Chavda', jerseyNumber: 1, position: 'GOALKEEPER', isCaptain: false },
      { name: 'Chirag Mehta', jerseyNumber: 3, position: 'DEFENDER', isCaptain: false },
      { name: 'Hardik Baraiya', jerseyNumber: 5, position: 'DEFENDER', isCaptain: false },
      { name: 'Ravi Kotak', jerseyNumber: 6, position: 'MIDFIELDER', isCaptain: false },
      { name: 'Vishal Chauhan', jerseyNumber: 8, position: 'MIDFIELDER', isCaptain: false },
      { name: 'Mayur Gohil', jerseyNumber: 9, position: 'FORWARD', isCaptain: true }, // ⭐ CAPTAIN
      { name: 'Pratik Joshi', jerseyNumber: 11, position: 'FORWARD', isCaptain: false },
      { name: 'Jaydeep Vaghela', jerseyNumber: 15, position: 'UTILITY', isCaptain: false },
    ],
    SST: [
      { name: 'Paresh Makwana', jerseyNumber: 1, position: 'GOALKEEPER', isCaptain: false },
      { name: 'Nilesh Vora', jerseyNumber: 2, position: 'DEFENDER', isCaptain: false },
      { name: 'Rajesh Gadhavi', jerseyNumber: 4, position: 'DEFENDER', isCaptain: false },
      { name: 'Hitesh Dangar', jerseyNumber: 6, position: 'MIDFIELDER', isCaptain: false },
      { name: 'Vipul Bheda', jerseyNumber: 7, position: 'MIDFIELDER', isCaptain: false },
      { name: 'Alpesh Sondarva', jerseyNumber: 8, position: 'FORWARD', isCaptain: false },
      { name: 'Chetan Ahir', jerseyNumber: 10, position: 'FORWARD', isCaptain: true }, // ⭐ CAPTAIN
      { name: 'Sanjay Bharwad', jerseyNumber: 12, position: 'UTILITY', isCaptain: false },
    ],
    SJR: [
      { name: 'Milan Koli', jerseyNumber: 1, position: 'GOALKEEPER', isCaptain: false },
      { name: 'Jatin Trivedi', jerseyNumber: 3, position: 'DEFENDER', isCaptain: false },
      { name: 'Vijay Chavda', jerseyNumber: 5, position: 'DEFENDER', isCaptain: false },
      { name: 'Shailesh Khuman', jerseyNumber: 7, position: 'MIDFIELDER', isCaptain: true }, // ⭐ CAPTAIN
      { name: 'Prakash Gohel', jerseyNumber: 8, position: 'MIDFIELDER', isCaptain: false },
      { name: 'Ashok Vala', jerseyNumber: 9, position: 'FORWARD', isCaptain: false },
      { name: 'Mehul Parmar', jerseyNumber: 11, position: 'FORWARD', isCaptain: false },
      { name: 'Kiran Der', jerseyNumber: 16, position: 'UTILITY', isCaptain: false },
    ],
    SND: [
      { name: 'Devang Bhatt', jerseyNumber: 1, position: 'GOALKEEPER', isCaptain: false },
      { name: 'Dharmik Chudasama', jerseyNumber: 2, position: 'DEFENDER', isCaptain: false },
      { name: 'Vikram Jadeja', jerseyNumber: 4, position: 'DEFENDER', isCaptain: true }, // ⭐ CAPTAIN
      { name: 'Sagar Barad', jerseyNumber: 5, position: 'MIDFIELDER', isCaptain: false },
      { name: 'Kuldeep Rathod', jerseyNumber: 7, position: 'FORWARD', isCaptain: false },
      { name: 'Aniruddh Zala', jerseyNumber: 8, position: 'MIDFIELDER', isCaptain: false },
      { name: 'Siddharth Mori', jerseyNumber: 10, position: 'FORWARD', isCaptain: false },
      { name: 'Ronak Solanki', jerseyNumber: 13, position: 'UTILITY', isCaptain: false },
    ],
    DHW: [
      { name: 'Gopal Rabari', jerseyNumber: 1, position: 'GOALKEEPER', isCaptain: false },
      { name: 'Jagdish Varu', jerseyNumber: 3, position: 'DEFENDER', isCaptain: false },
      { name: 'Nitin Boricha', jerseyNumber: 6, position: 'DEFENDER', isCaptain: false },
      { name: 'Naresh Khasiya', jerseyNumber: 7, position: 'MIDFIELDER', isCaptain: false },
      { name: 'Mukesh Bhabhor', jerseyNumber: 8, position: 'MIDFIELDER', isCaptain: false },
      { name: 'Kamlesh Vaza', jerseyNumber: 9, position: 'FORWARD', isCaptain: false },
      { name: 'Bharat Bagda', jerseyNumber: 11, position: 'FORWARD', isCaptain: true }, // ⭐ CAPTAIN
      { name: 'Ashwin Bambhaniya', jerseyNumber: 14, position: 'UTILITY', isCaptain: false },
    ],
  };

  const createdPlayers: Record<string, Record<string, any>> = {};

  for (const [teamCode, players] of Object.entries(playersByTeam)) {
    createdPlayers[teamCode] = {};
    const team = createdTeams[teamCode];
    let captainId: string | null = null;

    for (const p of players) {
      const player = await prisma.player.create({
        data: {
          teamId: team.id,
          name: p.name,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
          isCaptain: p.isCaptain,
          status: 'ACTIVE',
        },
      });

      createdPlayers[teamCode][p.name] = player;
      if (p.isCaptain) {
        captainId = player.id;
      }
    }

    if (captainId) {
      await prisma.team.update({
        where: { id: team.id },
        data: { captainId },
      });
    }
  }
  console.log('Created all team rosters and assigned captains.');

  // 5. Create Matches and Events
  // Match 1: AHC vs SST (4 - 2) COMPLETED
  const m1 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 1,
      teamAId: createdTeams['AHC'].id,
      teamBId: createdTeams['SST'].id,
      teamAScore: 4,
      teamBScore: 2,
      date: new Date('2026-09-18T10:00:00Z'),
      time: '10:00 AM',
      venue: 'Pitch 1 - Main Turf',
      status: 'COMPLETED',
      winnerId: createdTeams['AHC'].id,
      notes: 'High intensity opener. Rahul Patel netted two crucial goals.',
    },
  });

  await prisma.matchEvent.createMany({
    data: [
      { matchId: m1.id, teamId: createdTeams['AHC'].id, playerId: createdPlayers['AHC']['Rahul Patel'].id, type: 'GOAL', minute: 12 },
      { matchId: m1.id, teamId: createdTeams['SST'].id, playerId: createdPlayers['SST']['Chetan Ahir'].id, type: 'GOAL', minute: 19 },
      { matchId: m1.id, teamId: createdTeams['AHC'].id, playerId: createdPlayers['AHC']['Ketan Solanki'].id, type: 'GOAL', minute: 24 },
      { matchId: m1.id, teamId: createdTeams['AHC'].id, playerId: createdPlayers['AHC']['Rahul Patel'].id, type: 'GOAL', minute: 38 },
      { matchId: m1.id, teamId: createdTeams['SST'].id, playerId: createdPlayers['SST']['Chetan Ahir'].id, type: 'GOAL', minute: 40 },
      { matchId: m1.id, teamId: createdTeams['AHC'].id, playerId: createdPlayers['AHC']['Jay Shah'].id, type: 'GOAL', minute: 42 },
      { matchId: m1.id, teamId: createdTeams['SST'].id, playerId: createdPlayers['SST']['Rajesh Gadhavi'].id, type: 'YELLOW_CARD', minute: 30 },
    ],
  });

  // Match 2: GLA vs SJR (3 - 1) COMPLETED
  const m2 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 2,
      teamAId: createdTeams['GLA'].id,
      teamBId: createdTeams['SJR'].id,
      teamAScore: 3,
      teamBScore: 1,
      date: new Date('2026-09-18T11:30:00Z'),
      time: '11:30 AM',
      venue: 'Pitch 1 - Main Turf',
      status: 'COMPLETED',
      winnerId: createdTeams['GLA'].id,
      notes: 'Gir Lions dominated with rapid wing play.',
    },
  });

  await prisma.matchEvent.createMany({
    data: [
      { matchId: m2.id, teamId: createdTeams['GLA'].id, playerId: createdPlayers['GLA']['Mayur Gohil'].id, type: 'GOAL', minute: 8 },
      { matchId: m2.id, teamId: createdTeams['SJR'].id, playerId: createdPlayers['SJR']['Ashok Vala'].id, type: 'GOAL', minute: 22 },
      { matchId: m2.id, teamId: createdTeams['GLA'].id, playerId: createdPlayers['GLA']['Mayur Gohil'].id, type: 'GOAL', minute: 31 },
      { matchId: m2.id, teamId: createdTeams['GLA'].id, playerId: createdPlayers['GLA']['Pratik Joshi'].id, type: 'GOAL', minute: 44 },
    ],
  });

  // Match 3: SND vs DHW (2 - 2) COMPLETED
  const m3 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 3,
      teamAId: createdTeams['SND'].id,
      teamBId: createdTeams['DHW'].id,
      teamAScore: 2,
      teamBScore: 2,
      date: new Date('2026-09-18T14:00:00Z'),
      time: '02:00 PM',
      venue: 'Pitch 2 - North Arena',
      status: 'COMPLETED',
      winnerId: null, // Draw
      notes: 'Thrilling draw with late equalizer by Dhari Warriors.',
    },
  });

  await prisma.matchEvent.createMany({
    data: [
      { matchId: m3.id, teamId: createdTeams['SND'].id, playerId: createdPlayers['SND']['Siddharth Mori'].id, type: 'GOAL', minute: 14 },
      { matchId: m3.id, teamId: createdTeams['DHW'].id, playerId: createdPlayers['DHW']['Bharat Bagda'].id, type: 'GOAL', minute: 18 },
      { matchId: m3.id, teamId: createdTeams['SND'].id, playerId: createdPlayers['SND']['Kuldeep Rathod'].id, type: 'GOAL', minute: 35 },
      { matchId: m3.id, teamId: createdTeams['DHW'].id, playerId: createdPlayers['DHW']['Kamlesh Vaza'].id, type: 'GOAL', minute: 41 },
    ],
  });

  // Match 4: GLA vs SND (2 - 0) COMPLETED (Clean sheet for GLA keeper Dharmesh Chavda!)
  const m4 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 4,
      teamAId: createdTeams['GLA'].id,
      teamBId: createdTeams['SND'].id,
      teamAScore: 2,
      teamBScore: 0,
      date: new Date('2026-09-18T15:30:00Z'),
      time: '03:30 PM',
      venue: 'Pitch 1 - Main Turf',
      status: 'COMPLETED',
      winnerId: createdTeams['GLA'].id,
      notes: 'Masterclass defensive display and clean sheet by Dharmesh Chavda.',
    },
  });

  await prisma.matchEvent.createMany({
    data: [
      { matchId: m4.id, teamId: createdTeams['GLA'].id, playerId: createdPlayers['GLA']['Mayur Gohil'].id, type: 'GOAL', minute: 15 },
      { matchId: m4.id, teamId: createdTeams['GLA'].id, playerId: createdPlayers['GLA']['Vishal Chauhan'].id, type: 'GOAL', minute: 39 },
    ],
  });

  // Match 5: AHC vs SJR (3 - 1) COMPLETED
  const m5 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 5,
      teamAId: createdTeams['AHC'].id,
      teamBId: createdTeams['SJR'].id,
      teamAScore: 3,
      teamBScore: 1,
      date: new Date('2026-09-18T17:00:00Z'),
      time: '05:00 PM',
      venue: 'Pitch 1 - Main Turf',
      status: 'COMPLETED',
      winnerId: createdTeams['AHC'].id,
      notes: 'Rahul Patel added 2 more goals to stay atop the scoring chart.',
    },
  });

  await prisma.matchEvent.createMany({
    data: [
      { matchId: m5.id, teamId: createdTeams['AHC'].id, playerId: createdPlayers['AHC']['Rahul Patel'].id, type: 'GOAL', minute: 7 },
      { matchId: m5.id, teamId: createdTeams['SJR'].id, playerId: createdPlayers['SJR']['Ashok Vala'].id, type: 'GOAL', minute: 18 },
      { matchId: m5.id, teamId: createdTeams['AHC'].id, playerId: createdPlayers['AHC']['Rahul Patel'].id, type: 'GOAL', minute: 29 },
      { matchId: m5.id, teamId: createdTeams['AHC'].id, playerId: createdPlayers['AHC']['Harsh Zala'].id, type: 'GOAL', minute: 43 },
    ],
  });

  // Match 6: SST vs DHW (3 - 0) COMPLETED (Clean sheet for SST keeper Paresh Makwana!)
  const m6 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 6,
      teamAId: createdTeams['SST'].id,
      teamBId: createdTeams['DHW'].id,
      teamAScore: 3,
      teamBScore: 0,
      date: new Date('2026-09-18T18:30:00Z'),
      time: '06:30 PM',
      venue: 'Pitch 2 - North Arena',
      status: 'COMPLETED',
      winnerId: createdTeams['SST'].id,
      notes: 'Strikers rebound with a commanding clean sheet victory.',
    },
  });

  await prisma.matchEvent.createMany({
    data: [
      { matchId: m6.id, teamId: createdTeams['SST'].id, playerId: createdPlayers['SST']['Chetan Ahir'].id, type: 'GOAL', minute: 10 },
      { matchId: m6.id, teamId: createdTeams['SST'].id, playerId: createdPlayers['SST']['Chetan Ahir'].id, type: 'GOAL', minute: 25 },
      { matchId: m6.id, teamId: createdTeams['SST'].id, playerId: createdPlayers['SST']['Alpesh Sondarva'].id, type: 'GOAL', minute: 37 },
    ],
  });

  // Upcoming Matches
  // Match 7: Clash of the Titans (AHC vs GLA) LIVE / UPCOMING TODAY 08:00 PM
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 7,
      teamAId: createdTeams['AHC'].id,
      teamBId: createdTeams['GLA'].id,
      date: new Date('2026-09-18T20:00:00Z'),
      time: '08:00 PM',
      venue: 'Pitch 1 - Main Floodlit Arena',
      status: 'UPCOMING',
      notes: 'Table toppers clash under stadium floodlights!',
    },
  });

  // Match 8: SJR vs SND Tomorrow 09:30 AM
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 8,
      teamAId: createdTeams['SJR'].id,
      teamBId: createdTeams['SND'].id,
      date: new Date('2026-09-19T09:30:00Z'),
      time: '09:30 AM',
      venue: 'Pitch 1 - Main Turf',
      status: 'UPCOMING',
    },
  });

  // Match 9: SST vs GLA Tomorrow 11:00 AM
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 9,
      teamAId: createdTeams['SST'].id,
      teamBId: createdTeams['GLA'].id,
      date: new Date('2026-09-19T11:00:00Z'),
      time: '11:00 AM',
      venue: 'Pitch 1 - Main Turf',
      status: 'UPCOMING',
    },
  });

  // Match 10: AHC vs DHW Tomorrow 04:00 PM
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 10,
      teamAId: createdTeams['AHC'].id,
      teamBId: createdTeams['DHW'].id,
      date: new Date('2026-09-19T16:00:00Z'),
      time: '04:00 PM',
      venue: 'Pitch 2 - North Arena',
      status: 'UPCOMING',
    },
  });

  // Match 11: GLA vs DHW Tomorrow 06:00 PM
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 11,
      teamAId: createdTeams['GLA'].id,
      teamBId: createdTeams['DHW'].id,
      date: new Date('2026-09-19T18:00:00Z'),
      time: '06:00 PM',
      venue: 'Pitch 1 - Main Floodlit Arena',
      status: 'UPCOMING',
      notes: 'Lions take on Warriors in an intense evening battle.',
    },
  });

  // Match 12: SJR vs DHW Sep 20 09:30 AM
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 12,
      teamAId: createdTeams['SJR'].id,
      teamBId: createdTeams['DHW'].id,
      date: new Date('2026-09-20T09:30:00Z'),
      time: '09:30 AM',
      venue: 'Pitch 2 - North Arena',
      status: 'UPCOMING',
    },
  });

  // Match 13: AHC vs SND Sep 20 11:00 AM
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 13,
      teamAId: createdTeams['AHC'].id,
      teamBId: createdTeams['SND'].id,
      date: new Date('2026-09-20T11:00:00Z'),
      time: '11:00 AM',
      venue: 'Pitch 1 - Main Turf',
      status: 'UPCOMING',
    },
  });

  // Match 14: SJR vs SST Sep 20 04:00 PM
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 14,
      teamAId: createdTeams['SJR'].id,
      teamBId: createdTeams['SST'].id,
      date: new Date('2026-09-20T16:00:00Z'),
      time: '04:00 PM',
      venue: 'Pitch 2 - North Arena',
      status: 'UPCOMING',
    },
  });

  // Match 15: SND vs SST Sep 20 06:00 PM
  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 'LEAGUE',
      matchNumber: 15,
      teamAId: createdTeams['SND'].id,
      teamBId: createdTeams['SST'].id,
      date: new Date('2026-09-20T18:00:00Z'),
      time: '06:00 PM',
      venue: 'Pitch 1 - Main Floodlit Arena',
      status: 'UPCOMING',
      notes: 'Final round-robin clash before the top 4 advance to the knockouts!',
    },
  });

  console.log('Created full 15-match round-robin league schedule for all 6 teams.');

  // 6. Announcements
  await prisma.announcement.createMany({
    data: [
      {
        tournamentId: tournament.id,
        title: '🔥 MEGA CLASH: Amreli Hockey Club vs Gir Lions Tonight at 8:00 PM!',
        message:
          'Both unbeaten giants face off under the floodlights at Pitch 1. Expect a capacity crowd at Amreli District Sports Complex Ground.',
        type: 'TABLE_UPDATE',
        priority: 'URGENT',
        isPinned: true,
      },
      {
        tournamentId: tournament.id,
        title: 'Golden Stick Race: Rahul Patel and Chetan Ahir Tied with 4 Goals',
        message:
          'Amreli captain Rahul Patel and Saurashtra Strikers spearhead Chetan Ahir share the top scorer spot with 4 goals each.',
        type: 'RESULT',
        priority: 'NORMAL',
        isPinned: false,
      },
      {
        tournamentId: tournament.id,
        title: 'Inaugural Amreli 1st Hockey 7-Side Tournament Officially Underway',
        message:
          'Dignitaries and sports enthusiasts from across Amreli and Saurashtra gathered for the grand opening ceremony.',
        type: 'GENERAL',
        priority: 'NORMAL',
        isPinned: false,
      },
    ],
  });

  // 7. Activity Log
  await prisma.activityLog.createMany({
    data: [
      {
        adminEmail: 'admin@amrelihockey.com',
        action: 'TOURNAMENT_INITIALIZED',
        description: 'Amreli 1st Hockey 7-Side Tournament launched with 6 teams and 15 league fixtures.',
      },
      {
        adminEmail: 'admin@amrelihockey.com',
        action: 'SCORE_RECORDED',
        description: 'Match #1: Amreli Hockey Club 4 — 2 Saurashtra Strikers completed and verified.',
      },
      {
        adminEmail: 'admin@amrelihockey.com',
        action: 'CAPTAIN_DESIGNATED',
        description: 'Rahul Patel designated as Official Captain for Amreli Hockey Club.',
      },
    ],
  });

  console.log('--- Database Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
