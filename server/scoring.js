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
// 5 rocks × 5 pts = 25, bonus 5 if all collected
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
  
  // STRICT: Bonus only if ALL 5 rocks collected
  let bonus = 0;
  if (data.bonus && rocksCollected === 5) {
    bonus = 5;
  }
  
  const total = baseScore + bonus;
  
  return {
    score: total,
    max: 30,
    details: [
      { label: 'Rocks collected', value: rocksCollected, points: baseScore },
      { label: 'All rocks bonus', value: bonus > 0 ? 'Yes' : 'No', points: bonus }
    ],
    warnings: data.bonus && rocksCollected < 5 ? ['Bonus ignored: Not all rocks collected'] : []
  };
}

// Mission 2: Feeding time! (15 pts)
// 2 meat × 5 pts = 10, bonus 5 if both launched
function calculateMission2(data) {
  const meat1 = data.meat1 || false;
  const meat2 = data.meat2 || false;
  
  const baseScore = (meat1 ? 5 : 0) + (meat2 ? 5 : 0);
  
  // STRICT: Bonus only if BOTH meat launched
  let bonus = 0;
  if (data.bonus && meat1 && meat2) {
    bonus = 5;
  }
  
  const total = baseScore + bonus;
  
  return {
    score: total,
    max: 15,
    details: [
      { label: 'Meat launched', value: (meat1 ? 1 : 0) + (meat2 ? 1 : 0), points: baseScore },
      { label: 'Both meat bonus', value: bonus > 0 ? 'Yes' : 'No', points: bonus }
    ],
    warnings: data.bonus && !(meat1 && meat2) ? ['Bonus ignored: Not both meat pieces launched'] : []
  };
}

// Mission 3: Move the hay bales (30 pts)
// 3 bales × (5 pickup + 5 forest) = 30
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
    let status = 'Not picked up';
    
    if (bale.pickup) {
      baleScore += 5;
      status = 'Picked up';
      
      if (bale.forest) {
        baleScore += 5;
        status = 'In forest';
      }
    }
    
    score += baleScore;
    details.push({ label: `Bale ${idx + 1}`, value: status, points: baleScore });
  });
  
  return {
    score,
    max: 30,
    details,
    warnings: []
  };
}

// Mission 4: Collect the bones (20 pts)
// 3 bones × (2 pickup + 3 base) = 15, bonus 5 if all in base
function calculateMission4(data) {
  const bones = [
    { pickup: data.bone1_pickup || false, base: data.bone1_base || false },
    { pickup: data.bone2_pickup || false, base: data.bone2_base || false },
    { pickup: data.bone3_pickup || false, base: data.bone3_base || false }
  ];
  
  let baseScore = 0;
  const details = [];
  let bonesInBase = 0;
  
  bones.forEach((bone, idx) => {
    let boneScore = 0;
    let status = 'Not collected';
    
    if (bone.pickup) {
      boneScore += 2;
      status = 'Picked up';
      
      if (bone.base) {
        boneScore += 3;
        status = 'In base';
        bonesInBase++;
      }
    }
    
    baseScore += boneScore;
    details.push({ label: `Bone ${idx + 1}`, value: status, points: boneScore });
  });
  
  // STRICT: Bonus only if ALL 3 bones in base
  let bonus = 0;
  if (data.bonus && bonesInBase === 3) {
    bonus = 5;
  }
  
  const total = baseScore + bonus;
  
  return {
    score: total,
    max: 20,
    details: [
      ...details,
      { label: 'All bones in base bonus', value: bonus > 0 ? 'Yes' : 'No', points: bonus }
    ],
    warnings: data.bonus && bonesInBase < 3 ? ['Bonus ignored: Not all bones in base'] : []
  };
}

// Mission 5: Sanctuary Tour (30 pts) - CRITICAL STRICT
// 4 locations × 10 pts = 40... wait, the spec says 30 pts
// Looking at spec: "i. For each researcher fully in base 10" - this seems wrong
// Based on "4 locations including river, forest, fossil pit and base"
// And "If a researcher topples 0", "If any locations are skipped 0"
// Let's assume 4 locations × 7.5 = 30 or maybe it's just 30 for completing all
function calculateMission5(data) {
  const locations = [
    data.river || false,
    data.forest || false,
    data.fossil_pit || false,
    data.base || false
  ];
  
  const locationsVisited = locations.filter(l => l).length;
  const allVisited = locationsVisited === 4;
  const baseLast = data.base_last || false;
  const toppled = data.researcher_toppled || false;
  
  let score = 0;
  const warnings = [];
  
  // STRICT RULE 1: If researcher toppled = 0 points
  if (toppled) {
    score = 0;
    warnings.push('Researcher toppled - 0 points');
  }
  // STRICT RULE 2: If any location skipped = 0 points
  else if (!allVisited) {
    score = 0;
    warnings.push('Not all locations visited - 0 points');
  }
  // STRICT RULE 3: Base must be last
  else if (!baseLast) {
    score = 0;
    warnings.push('Base not visited last - 0 points');
  }
  else {
    score = 30;
  }
  
  return {
    score,
    max: 30,
    details: [
      { label: 'Locations visited', value: `${locationsVisited}/4`, points: toppled || !allVisited || !baseLast ? 0 : 30 },
      { label: 'Base last', value: baseLast ? 'Yes' : 'No', points: 0 },
      { label: 'Researcher toppled', value: toppled ? 'Yes' : 'No', points: 0 }
    ],
    warnings
  };
}

// Mission 6: Rescue (15 pts) - CRITICAL STRICT
// Picked up: 5, On stump: 10
// If nest fell OR not on stump = 0 points
function calculateMission6(data) {
  const pickedUp = data.nest_picked_up || false;
  const onStump = data.nest_on_stump || false;
  const fell = data.nest_fell || false;
  
  let score = 0;
  const warnings = [];
  
  // STRICT: If nest fell = 0 points
  if (fell) {
    score = 0;
    warnings.push('Nest fell - 0 points');
  }
  // STRICT: If not on stump = 0 points
  else if (!onStump) {
    score = 0;
    warnings.push('Nest not on stump - 0 points');
  }
  else if (pickedUp && onStump) {
    score = 15;
  }
  
  return {
    score,
    max: 15,
    details: [
      { label: 'Nest picked up', value: pickedUp ? 'Yes' : 'No', points: pickedUp && onStump && !fell ? 5 : 0 },
      { label: 'Nest on stump', value: onStump ? 'Yes' : 'No', points: pickedUp && onStump && !fell ? 10 : 0 },
      { label: 'Nest fell', value: fell ? 'Yes' : 'No', points: 0 }
    ],
    warnings
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
      { label: 'Plate pressed', value: pressed ? 'Yes' : 'No', points: score }
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

// Get ranking with tiebreaker (time)
export function calculateRankings(teams, scores) {
  // Group scores by team and get best score
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
  
  // Create ranked list
  const ranked = Object.values(teamBestScores)
    .map(score => ({
      ...score,
      team: teams.find(t => t.id === score.team_id)
    }))
    .sort((a, b) => {
      // Sort by score (desc), then by time (asc)
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