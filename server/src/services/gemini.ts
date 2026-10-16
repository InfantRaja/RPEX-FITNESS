import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are REPX AI Coach, a world-class personal fitness trainer and sports nutritionist built into the REPX Tracker app.

Your expertise includes:
- Strength training, powerlifting, bodybuilding, cardio, HIIT, and functional mobility
- Precision nutrition, macronutrient splits, meal timing, hydration, and safe supplementation
- Body composition transformation (fat loss, hypertrophy, recomposition, athletic conditioning)
- Evidence-based workout programming and progressive overload methodology
- Recovery optimization, sleep hygiene, CNS fatigue management, and mobility work
- Habit formulation, mental resilience, and high-performance mindset coaching

Tone & Style Guidelines:
- Enthusiastic, motivating, authoritative yet friendly and supportive
- Provide clear, actionable, structured instructions with markdown headings, bullet points, and emojis
- Personalize guidance using the user's profile (name, goal, experience, training location, equipment)
- Keep advice safe, realistic, and science-backed
- Never include disclaimers or placeholder warnings in user conversations`;

export const validateGeminiApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey || apiKey.trim().length < 15 || apiKey === 'placeholder_gemini_api_key') {
    return false;
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const testResult = await model.generateContent('Say ok');
    const text = testResult.response.text();
    return !!text && text.length > 0;
  } catch (error) {
    console.error('Failed to validate Gemini API key:', error);
    return false;
  }
};

export const generateAIResponse = async (
  message: string,
  history: Array<{ role: string; content: string }>,
  userContext: Record<string, any>,
  language: string = 'en'
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'placeholder_gemini_api_key' && apiKey.trim().length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const contextStr = Object.keys(userContext).length > 0
        ? `\n\nUser Profile:\n${JSON.stringify(userContext, null, 2)}`
        : '';

      const languageInstruction = language !== 'en'
        ? `\n\nIMPORTANT: Respond in the following language: ${getLanguageName(language)}`
        : '';

      const fullSystemPrompt = SYSTEM_PROMPT + contextStr + languageInstruction;

      const chatHistory = history.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: fullSystemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood! I am REPX AI Coach, ready to guide your fitness journey.' }] },
          ...chatHistory,
        ],
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(message);
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (error: any) {
      console.warn('Gemini API call failed, falling back to smart local fitness engine:', error?.message || error);
    }
  }

  // Graceful, intelligent contextual fitness response (Zero external dependencies)
  return generateSmartFitnessResponse(message, userContext);
};

export function generateSmartFitnessResponse(message: string, userContext: Record<string, any>): string {
  const name = userContext.name || 'Champion';
  const rawGoal = userContext.fitnessGoal || 'general_fitness';
  const goal = rawGoal.replace(/_/g, ' ');
  const experience = userContext.experience || 'intermediate';
  const location = userContext.workoutLocation || 'gym';
  const equipment = Array.isArray(userContext.equipment) && userContext.equipment.length > 0
    ? userContext.equipment.join(', ')
    : (location === 'home' ? 'bodyweight and dumbbells' : 'full gym equipment');
  const weight = userContext.weight ? `${userContext.weight} kg` : '70 kg';

  const lower = message.toLowerCase().trim();

  // 1. Greetings & Introductions
  if (/^(hi|hello|hey|yo|greetings|morning|afternoon|evening|sup|what'?s up|who are you)\b/i.test(lower)) {
    return `Hey **${name}**! 👋 Welcome to your training session. I'm your **REPX AI Coach**.

I'm dialed into your profile:
- 🎯 **Primary Goal:** ${goal.toUpperCase()}
- 🏅 **Experience:** ${experience.toUpperCase()}
- 📍 **Setting:** ${location.toUpperCase()} (${equipment})

Here is how we can level up your training today:
1. 🏋️‍♂️ **Workout Plans & Splits** — Ask for a custom push/pull/legs, upper/lower, or full-body session.
2. 🥗 **Nutrition & Macro Targets** — Get optimal daily calories, protein, and meal ideas tailored for ${goal}.
3. 📈 **Overcoming Plateaus** — Practical strategies to boost strength and break weight stagnation.
4. 🔍 **Exercise Form & Technique** — Ask how to perform any movement with textbook biomechanics.

What do you want to crush today?`;
  }

  // 2. Workout Plans / Routine / Split Requests
  if (/workout plan|routine|split|program|push pull|upper lower|full body|training plan|schedule/i.test(lower)) {
    if (goal.includes('fat loss') || goal.includes('weight loss')) {
      return `Here is your high-efficiency **Fat Loss & Metabolic Conditioning Plan** for **${name}**:

### 📅 Weekly Split (${location.toUpperCase()} • ${experience.toUpperCase()})
- **Day 1: Upper Body Strength & Core**
  - Incline Dumbbell Press: 4 sets × 8-10 reps (Rest 60-90s)
  - Seated Cable Rows: 4 sets × 10-12 reps
  - Dumbbell Lateral Raises: 4 sets × 12-15 reps
  - Hanging Knee / Leg Raises: 3 sets × 15 reps
  - *Finisher:* 10 min Incline Treadmill Walk (12% incline, 4.5 km/h)
- **Day 2: Lower Body Power & Posterior Chain**
  - Goblet or Barbell Squats: 4 sets × 8-10 reps
  - Romanian Deadlifts (RDLs): 3 sets × 10-12 reps
  - Bulgarian Split Squats: 3 sets × 10 reps/leg
  - Standing Calf Raises: 4 sets × 15 reps
- **Day 3: Active Recovery & Mobility**
  - 8,000–10,000 daily steps + 15 min mobility/foam rolling
- **Day 4: Full Body Functional Circuit**
  - Dumbbell Thrusters: 4 sets × 10 reps
  - Push-ups / Chest Dips: 3 sets to failure
  - Kettlebell or Dumbbell Swings: 4 sets × 15 reps
  - Plank: 3 sets × 60s hold

### ⚡ Coach's Key Tips:
- Maintain heavy weights to **preserve lean muscle** while in a caloric deficit.
- Aim for 8,000–10,000 steps daily outside the gym for effortless energy expenditure.`;
    }

    return `Here is your **Hypertrophy & Strength Program** tailored for **${name}**:

### 📅 4-Day Upper / Lower Power Split (${location.toUpperCase()})

#### Day 1: Upper Body Heavy (Mechanical Tension)
- **Barbell / Dumbbell Bench Press**: 4 sets × 6–8 reps (Rest 2–3 min)
- **Barbell or Chest-Supported Row**: 4 sets × 6–8 reps (Rest 2 min)
- **Standing Overhead Press**: 3 sets × 8–10 reps (Rest 90s)
- **Lat Pulldowns or Pull-ups**: 3 sets × 8–10 reps (Rest 90s)
- **Incline Dumbbell Bicep Curls**: 3 sets × 10–12 reps
- **Tricep Cable Pushdowns**: 3 sets × 12–15 reps

#### Day 2: Lower Body & Posterior Chain
- **Barbell Back Squat / Hack Squat**: 4 sets × 6–8 reps (Rest 2–3 min)
- **Romanian Deadlift (RDL)**: 3 sets × 8–10 reps (Focus on hamstring stretch)
- **Walking Dumbbell Lunges**: 3 sets × 10 reps each leg
- **Standing Calf Raises**: 4 sets × 12–15 reps (Pause 1s at top)
- **Hanging Leg Raises**: 3 sets × 12–15 reps

#### Day 3: Active Rest & Recovery
- Mobility flow, hydration, and light walking.

#### Day 4: Upper Body Hypertrophy (Pump & Volume)
- **Incline Dumbbell Press**: 4 sets × 8–10 reps
- **Seated Cable Row (Close Grip)**: 4 sets × 10–12 reps
- **Dumbbell Lateral Raises**: 4 sets × 12–15 reps (Strict form)
- **Dips (Bodyweight or Weighted)**: 3 sets × 10–12 reps
- **Cable Hammer Curls with Rope**: 3 sets × 12 reps

#### Day 5: Lower Body Hypertrophy & Hamstrings
- **Leg Press**: 4 sets × 10–12 reps
- **Lying or Seated Leg Curls**: 4 sets × 12–15 reps
- **Bulgarian Split Squats**: 3 sets × 10 reps each leg
- **Ab Wheel Rollouts / Cable Crunches**: 3 sets × 15 reps

### 🏆 Progressive Overload Rule:
Whenever you reach the highest reps in a range with clean form, add 2.5 kg next session! Log every workout in your **Workouts** tab to track your curve.`;
  }

  // 3. Nutrition / Food / Macros / Protein
  if (/nutrition|diet|eat|food|protein|calorie|macro|meal plan|supplement|shake/i.test(lower)) {
    const isBulking = goal.includes('muscle') || goal.includes('strength') || goal.includes('weight_gain');
    const isCutting = goal.includes('fat') || goal.includes('weight_loss');

    const estCalories = isCutting ? 1900 : isBulking ? 2600 : 2200;
    const estProtein = Math.round(75 * 2.0); // ~150g protein benchmark
    const estCarbs = isCutting ? 180 : 280;
    const estFats = isCutting ? 55 : 70;

    return `Here is your **Precision Nutrition Guide** for **${goal}**:

### 🎯 Daily Target Breakdown (Est. Weight: ${weight})
- **Calories:** ~${estCalories} kcal/day ${isCutting ? '(Caloric Deficit)' : isBulking ? '(Lean Surplus)' : '(Maintenance)'}
- **Protein:** **${estProtein}g** (1.8g - 2.2g per kg bodyweight — crucial for muscle repair)
- **Carbohydrates:** **${estCarbs}g** (Fuel for heavy lifting & glycogen replenishment)
- **Healthy Fats:** **${estFats}g** (Hormone synthesis & joint health)
- **Water:** 3.0–3.5 Liters daily

### 🥗 Sample High-Protein Meal Structure:
1. **Breakfast (Power Fuel):**
   - 3 whole eggs + 2 egg whites scrambled with spinach & whole-wheat toast
   - 1 banana or a cup of berries
   - *Protein: ~32g*
2. **Lunch (Clean Sustained Energy):**
   - 150g grilled chicken breast or tofu/paneer
   - 150g cooked brown rice or quinoa
   - Steamed broccoli or green salad with olive oil
   - *Protein: ~40g*
3. **Pre-Workout Fuel (60-90 min before):**
   - Rice cake with 1 tbsp peanut butter or an apple + black coffee
4. **Post-Workout Recovery:**
   - 1 scoop Whey Protein or Plant Protein in water/milk + 1 banana
   - *Protein: ~26g*
5. **Dinner (Rest & Repair):**
   - 160g salmon, lean beef, or lentils/cottage cheese
   - Baked sweet potato or roasted vegetables
   - *Protein: ~38g*

Log your meals in the **Nutrition** tab daily to stay in your target zone!`;
  }

  // 4. Weight Loss / Fat Loss Plateau
  if (/plateau|stuck|lose weight|fat loss|cut|shred/i.test(lower)) {
    return `Hitting a plateau is completely normal, **${name}**. Here is how to break through it scientifically:

### 🔬 4 Steps to Break Fat Loss Plateaus
1. **Audit Hidden Calories:**
   - Salad dressings, cooking oils (1 tbsp olive oil is 120 kcal!), snacks, and liquid calories often close a deficit without you knowing. Track every bite for 3 days.
2. **Increase Daily NEAT (Non-Exercise Activity):**
   - Your body naturally downregulates fidgeting and spontaneous movement when dieting. Boost your step count by +2,000 steps per day (take stairs, brisk phone walks).
3. **Keep Protein High (${goal.includes('fat') ? '2.0g/kg' : '1.8g/kg'}):**
   - High protein has the highest thermic effect of food (TEF) and safeguards muscle so your metabolic rate doesn't plummet.
4. **Check Sleep & Cortisol:**
   - Sleeping under 7 hours spikes cortisol, causing water retention that masks fat loss on the scale for up to 2-3 weeks! Aim for 7.5–8.5 hours.

Stay consistent—often a 'whoosh' effect occurs right after a 2-week plateau!`;
  }

  // 5. Muscle Building & Hypertrophy
  if (/muscle|hypertrophy|bulk|gains|size|mass/i.test(lower)) {
    return `Building clean, dense muscle comes down to three non-negotiable pillars for **${name}**:

### 🏛️ The 3 Pillars of Hypertrophy
1. **Mechanical Tension & Proximity to Failure:**
   - Take your working sets to **1–2 Reps in Reserve (RIR)**. If your set target is 10 reps, rep 9 and 10 should be challenging with controlled eccentrics (2 seconds down).
2. **Weekly Volume Sweet Spot:**
   - Aim for **10 to 18 hard sets per muscle group per week**, split across 2 sessions (e.g. hitting chest on Monday and Thursday).
3. **Slight Caloric Surplus:**
   - Eat ~250–350 kcal above maintenance with 1.8–2.2g protein per kg. A clean surplus provides energy for intense lifting without excessive fat gain.

Which muscle group are you looking to bring up right now?`;
  }

  // 6. Chest / Bench Press
  if (/chest|bench press|pecs|push-up/i.test(lower)) {
    return `Here are the gold-standard cues to build a powerful chest:

### 🛡️ Chest Biomechanics & Growth Guide
- **Retract and Depress the Scapulae:** Pull your shoulder blades together and down into the bench to stabilize shoulders and maximize pec engagement.
- **Incline is King for Aesthetics:** Prioritize the **30° Incline Dumbbell Press** to build the clavicular upper chest.
- **Control the Eccentric:** Take 2 full seconds to lower the weight, pause for a split second in the deep stretch, and drive up explosively without bouncing.
- **Ideal Chest Routine:**
  1. Flat Barbell or Dumbbell Press: 4 sets × 6–8 reps
  2. Incline Dumbbell Press (30° angle): 3 sets × 8–10 reps
  3. Cable Chest Flyes (Converging squeeze): 3 sets × 12–15 reps
  4. Push-ups / Dips to burnout: 2 sets to failure`;
  }

  // 7. Legs / Squats
  if (/leg|legs|squat|quad|hamstring|glute|calves/i.test(lower)) {
    return `Leg training demands high mental toughness and pristine technique:

### 🦵 Complete Leg Development Protocol
- **Squat Depth:** Hip crease passing below the top of the knee with feet shoulder-width apart, knees tracking in line with toes.
- **Posterior Chain Mastery:** Never skip Romanian Deadlifts (RDLs). Push hips back like closing a car door with your glutes to fire hamstrings without lower back strain.
- **Recommended Leg Day:**
  1. Barbell Back Squat or Hack Squat: 4 sets × 6–8 reps
  2. Romanian Deadlifts (Dumbbell or Barbell): 3 sets × 8–10 reps
  3. Bulgarian Split Squats: 3 sets × 10 reps/leg (Quads on fire)
  4. Seated or Lying Hamstring Curls: 3 sets × 12–15 reps
  5. Standing Calf Raises: 4 sets × 15 reps (Pause at peak stretch)`;
  }

  // 8. Recovery, Sleep & Soreness
  if (/recover|sleep|sore|doms|stretching|rest day/i.test(lower)) {
    return `Remember: **You don't grow in the gym; you break down muscle in the gym and grow while recovering!**

### 💤 Top Recovery Checklist for ${name}:
- **Sleep Quality:** 7–9 hours of deep sleep. Human Growth Hormone (HGH) peaks during slow-wave deep sleep.
- **DOMS Management:** Delayed Onset Muscle Soreness is not necessarily an indicator of growth. Light 20-minute walking, hydration with electrolytes, and contrast showers accelerate recovery.
- **Active Rest Days:** Keep blood flowing with light stretching, 8,000 steps, and mobility drills instead of lying completely still.
- **Hydration:** Aim for 3+ liters of water daily to maintain intracellular muscle volume.`;
  }

  // 9. Motivation & Mindset
  if (/motivat|lazy|hard|can't|tired|give up|discipline/i.test(lower)) {
    return `Listen up, **${name}**: 🔥

> *"Motivation gets you started. Discipline keeps you going when motivation fades."*

Every athlete who ever achieved an incredible physique had days where they felt tired, distracted, or unmotivated. The difference between average and greatness is showing up on the days you don't feel like it.

**Action Plan for Today:**
1. Just put your gym shoes on.
2. Commit to just 10 minutes of training or warmup.
3. Once the blood starts pumping, momentum will carry you through.

You have the goal of **${goal}**. Let's go take one more step toward it today! ⚡`;
  }

  // 10. General / Fallback Contextual Response
  return `Great question, **${name}**! Regarding your training for **${goal}**:

Here is my coach's assessment for you (${experience} level at ${location}):
- **Consistency First:** Regular training 3–5 days a week delivers 10x more results than sporadic intense bursts.
- **Nutrition Alignment:** Ensure your calorie and protein intake directly matches your **${goal}** objective.
- **Track Your Progress:** Keep your sets, weights, and body measurements updated in your dashboard.

Feel free to ask me for:
- 🏋️ A specific workout split or exercise alternatives
- 🥗 Daily meal and macro calculations
- 🔍 Form tips and injury prevention advice

What would you like to explore next?`;
}

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    ar: 'Arabic',
    hi: 'Hindi',
    zh: 'Chinese (Mandarin)',
    ja: 'Japanese',
    ko: 'Korean',
    it: 'Italian',
    ru: 'Russian',
  };
  return languages[code] || 'English';
}
