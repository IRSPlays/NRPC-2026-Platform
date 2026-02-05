// Strict Scoring Rules Engine
// Maximum score: 155 points

export function calculateMissionScore(missionId, data) {
  switch (missionId) {
    case 1:
      return calculateMission1(data);
    case 2:
      return calculateMission2(data);
    case 3:
      return calculateMission3(data);
    case 4:
      return calculateMission4(data);
    case 5:
      return calculateMission5(data);
    case 6:
      return calculateMission6(data);
    case 7:
      return calculateMission7(data);
    default:
      return { score: 0, max: 0, details: [] };
  }
}

// Mission 1: Clear the way (30 pts)
function calculateMission1(data) {
  const rocks = [
    data.rock1 || false,
    data.rock2 || false,
    data.rock3 || false,
    data.rock4 || false,
    data.rock5 || false
  ];
  
  const rocksCollected = rocks.filter(r => r).length;
  const baseScore = rocksCollected * 5;
  
  let bonus = 0;
  if (data.bonus && rocksCollected === 5) {
    bonus = 5;
  }
  
  const total = baseScore + bonus;
  
  return {
    score: total,
    max: 30,
    details: [
      { label: 'Rocks dropped off in Processing Plant', value: rocksCollected, points: baseScore },
      { label: 'All rocks dropped off (EXTRA)', value: bonus > 0 ? 'Yes' : 'No', points: bonus }
    ],
    warnings: data.bonus && rocksCollected < 5 ? ['Bonus ignored: Not all rocks dropped off'] : []
  };
}

// Mission 2: Feeding time! (15 pts)
function calculateMission2(data) {
  const meat1 = data.meat1 || false;
  const meat2 = data.meat2 || false;
  
  const baseScore = (meat1 ? 5 : 0) + (meat2 ? 5 : 0);
  
  let bonus = 0;
  if (data.bonus && meat1 && meat2) {
    bonus = 5;
  }
  
  const total = baseScore + bonus;
  
  return {
    score: total,
    max: 15,
    details: [
      { label: 'Meat launched into enclosure', value: (meat1 ? 1 : 0) + (meat2 ? 1 : 0), points: baseScore },
      { label: 'Both pieces successfully launched (EXTRA)', value: bonus > 0 ? 'Yes' : 'No', points: bonus }
    ],
    warnings: data.bonus && !(meat1 && meat2) ? ['Bonus ignored: Not both meat pieces launched'] : []
  };
}

// Mission 3: Store the hay bales (30 pts)
function calculateMission3(data) {
  const bales = [
    { pickup: data.bale1_pickup || false, forest: data.bale1_forest || false },
    { pickup: data.bale2_pickup || false, forest: data.bale2_forest || false },
    { pickup: data.bale3_pickup || false, forest: data.bale3_forest || false }
  ];
  
  let score = 0;
  const details = [];
  
  bales.forEach((bale, idx) => {
    let baleScore = 0;
    if (bale.pickup) {
      baleScore += 5;
      if (bale.forest) {
        baleScore += 5;
      }
    }
    
    score += baleScore;
    details.push({ label: `Bale ${idx + 1} score`, value: baleScore + ' PTS', points: baleScore });
  });
  
  return {
    score,
    max: 30,
    details,
    warnings: []
  };
}

// Mission 4: Collect the fossils (20 pts)
function calculateMission4(data) {
  const fossils = [
    { pickup: data.bone1_pickup || false, base: data.bone1_base || false },
    { pickup: data.bone2_pickup || false, base: data.bone2_base || false },
    { pickup: data.bone3_pickup || false, base: data.bone3_base || false }
  ];
  
  let baseScore = 0;
  let fossilsInBase = 0;
  
  fossils.forEach((fossil) => {
    if (fossil.pickup) {
      baseScore += 2;
      if (fossil.base) {
        baseScore += 3;
        fossilsInBase++;
      }
    }
  });
  
  let bonus = 0;
  if (data.bonus && fossilsInBase === 3) {
    bonus = 5;
  }
  
  const total = baseScore + bonus;
  
  return {
    score: total,
    max: 20,
    details: [
      { label: 'Fossil base score', value: baseScore, points: baseScore },
      { label: 'All 3 fossils fully in base (EXTRA)', value: bonus > 0 ? 'Yes' : 'No', points: bonus }
    ],
    warnings: data.bonus && fossilsInBase < 3 ? ['Bonus ignored: Not all fossils in base'] : []
  };
}

// Mission 5: Sanctuary Tour (30 pts)
function calculateMission5(data) {
  const scientistsInBase = data.scientists_in_base || 0;
  const scientistFell = data.researcher_toppled || false;
  
  let score = 0;
  if (!scientistFell) {
    score = scientistsInBase * 10;
  }
  
  return {
    score,
    max: 30,
    details: [
      { label: 'Scientists fully in base', value: scientistsInBase, points: score },
      { label: 'Scientist fell over', value: scientistFell ? 'Yes' : 'No', points: 0 }
    ],
    warnings: scientistFell ? ['Scientist fell over - 0 points awarded'] : []
  };
}

// Mission 6: Rescue (15 pts)
function calculateMission6(data) {
  const nestOut = data.nest_picked_up || false;
  const onStump = data.nest_on_stump || false;
  const fell = data.nest_fell || false;
  
  let score = 0;
  if (!fell) {
    if (nestOut) score += 5;
    if (onStump) score += 10;
  }
  
  return {
    score,
    max: 15,
    details: [
      { label: 'Nest out of starting position', value: nestOut ? 'Yes' : 'No', points: !fell && nestOut ? 5 : 0 },
      { label: 'Nest upright on tree stump', value: onStump ? 'Yes' : 'No', points: !fell && onStump ? 10 : 0 },
      { label: 'Nest fell', value: fell ? 'Yes' : 'No', points: 0 }
    ],
    warnings: fell ? ['Nest fell - 0 points awarded'] : []
  };
}

// Mission 7: Power it up (15 pts)
function calculateMission7(data) {
  const pressed = data.plate_pressed || false;
  const score = pressed ? 15 : 0;
  
  return {
    score,
    max: 15,
    details: [
      { label: 'Fan blades move when plate touched', value: pressed ? 'Yes' : 'No', points: score }
    ],
    warnings: []
  };
}

// Calculate total score from all missions
export function calculateTotalScore(missionData) {
  const missions = [];
  let total = 0;
  const allWarnings = [];
  
  for (let i = 1; i <= 7; i++) {
    const result = calculateMissionScore(i, missionData[`mission${i}`] || {});
    missions.push({
      missionId: i,
      ...result
    });
    total += result.score;
    allWarnings.push(...result.warnings);
  }
  
  return {
    missions,
    total,
    maxTotal: 155,
    warnings: allWarnings
  };
}

// Validate filename format: (TeamName)_(School)_poster
export function validatePosterFilename(filename, teamName, schoolName) {
  const expectedPattern = new RegExp(
    `^${teamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_${schoolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_poster`,
    'i'
  );
  
  if (!expectedPattern.test(filename)) {
    return {
      valid: false,
      error: `Filename should be: "${teamName}_${schoolName}_poster.pdf"`,
      expected: `${teamName}_${schoolName}_poster`
    };
  }
  
  return { valid: true };
}

// Get ranking with tiebreaker (time) for Robot Performance
export function calculateRankings(teams, scores) {
  const teamBestScores = {};
  
  scores.forEach(score => {
    const teamId = score.team_id;
    if (!teamBestScores[teamId] || 
        score.total_score > teamBestScores[teamId].total_score ||
        (score.total_score === teamBestScores[teamId].total_score && 
         score.completion_time_seconds < teamBestScores[teamId].completion_time_seconds)) {
      teamBestScores[teamId] = score;
    }
  });
  
  const ranked = Object.values(teamBestScores)
    .map(score => ({
      ...score,
      team: teams.find(t => t.id === score.team_id)
    }))
    .sort((a, b) => {
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      return (a.completion_time_seconds || Infinity) - (b.completion_time_seconds || Infinity);
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  
  return ranked;
}

// Calculate Championship Ranking
// 60% Robot (155), 20% Mechanical (100), 20% Poster (100)
export function calculateChampionshipRankings(teams, scores, submissions) {
  const teamStats = {};

  scores.forEach(score => {
    const teamId = score.team_id;
    if (!teamStats[teamId]) teamStats[teamId] = { robot: 0, mech: 0, poster: 0, time: 999 };
    
    if (score.total_score > teamStats[teamId].robot) {
      teamStats[teamId].robot = score.total_score;
      teamStats[teamId].mech = score.mechanical_design_score || 0;
      teamStats[teamId].time = score.completion_time_seconds;
    } else if (score.total_score === teamStats[teamId].robot) {
      if (score.completion_time_seconds < teamStats[teamId].time) {
        teamStats[teamId].mech = score.mechanical_design_score || 0;
        teamStats[teamId].time = score.completion_time_seconds;
      }
    }
  });

  submissions.forEach(sub => {
    const teamId = sub.team_id;
    if (!teamStats[teamId]) teamStats[teamId] = { robot: 0, mech: 0, poster: 0, time: 999 };
    
    if (sub.concept_score) {
      const totalPoster = (sub.concept_score || 0) + 
                          (sub.future_score || 0) + 
                          (sub.organization_score || 0) + 
                          (sub.aesthetics_score || 0);
      if (totalPoster > teamStats[teamId].poster) {
        teamStats[teamId].poster = totalPoster;
      }
    }
  });

  const rankings = teams.map(team => {
    const stats = teamStats[team.id] || { robot: 0, mech: 0, poster: 0, time: 999 };
    
    const weightedRobot = (stats.robot / 155) * 60;
    const weightedMech = (stats.mech / 100) * 20;
    const weightedPoster = (stats.poster / 100) * 20;
    
    const championshipScore = weightedRobot + weightedMech + weightedPoster;

    return {
      team,
      stats,
      championshipScore: parseFloat(championshipScore.toFixed(2)),
      details: {
        weightedRobot: parseFloat(weightedRobot.toFixed(2)),
        weightedMech: parseFloat(weightedMech.toFixed(2)),
        weightedPoster: parseFloat(weightedPoster.toFixed(2))
      }
    };
  });

  return rankings.sort((a, b) => b.championshipScore - a.championshipScore).map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}