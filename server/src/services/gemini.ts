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
  return generateSmartFitnessResponse(message, userContext, language);
};

export function generateSmartFitnessResponse(
  message: string,
  userContext: Record<string, any>,
  language: string = 'en'
): string {
  const name = userContext.name || 'Champion';
  const rawGoal = userContext.fitnessGoal || 'general_fitness';
  const goal = rawGoal.replace(/_/g, ' ');
  const experience = userContext.experience || 'intermediate';
  const location = userContext.workoutLocation || 'gym';
  const equipment = Array.isArray(userContext.equipment) && userContext.equipment.length > 0
    ? userContext.equipment.join(', ')
    : (location === 'home' ? 'bodyweight and dumbbells' : 'full gym equipment');
  const weight = userContext.weight ? `${userContext.weight} kg` : '70 kg';
  const weightVal = parseFloat(userContext.weight) || 70;
  const dietPref = userContext.dietaryPreference || 'non_vegetarian';

  const targets = userContext.nutritionTargets;
  const today = userContext.todayNutrition;

  const targetCal = targets?.dailyCalories || (goal.includes('fat') ? 1900 : goal.includes('muscle') ? 2500 : 2200);
  const targetProt = targets?.proteinGrams || Math.round(weightVal * 1.8);
  const targetCarbs = targets?.carbsGrams || Math.round((targetCal * 0.45) / 4);
  const targetFats = targets?.fatGrams || Math.round((targetCal * 0.25) / 9);

  const consumedCal = today?.consumedCalories || 0;
  const consumedProt = today?.consumedProtein || 0;
  const remCal = today?.remainingCalories ?? Math.max(0, targetCal - consumedCal);
  const remProt = today?.remainingProtein ?? Math.max(0, targetProt - consumedProt);

  const lower = message.toLowerCase().trim();
  const isTa = language === 'ta';
  const isTanglish = language === 'tanglish';

  // 1. Greetings & Introductions
  if (/^(hi|hello|hey|yo|greetings|morning|afternoon|evening|sup|what'?s up|who are you|vanakkam)\b/i.test(lower)) {
    if (isTa) {
      return `வணக்கம் **${name}**! 🙏 நான் உங்கள் **RPEX AI Coach**.

உங்கள் உடற்பயிற்சி மற்றும் உணவு விவரங்கள்:
- 🎯 **இலக்கு:** ${goal.toUpperCase()}
- ⚖️ **எடை:** ${weight} | **இன்றைய கலோரி இலக்கு:** ${targetCal} kcal
- 🥩 **புரதம் (Protein) இலக்கு:** ${targetProt}g (மீதம்: ${remProt}g)

நான் உங்களுக்கு உதவக்கூடிய பகுதிகள்:
1. 🥗 **இன்றைய டயட் & உணவுகள்** — எந்த உணவு எவ்வளவு சாப்பிட வேண்டும்?
2. 🏋️ **வொர்க்அவுட் பிளான்** — சிறந்த பயிற்சி முறைகள்
3. 💰 **குறைந்த பட்ஜெட் புரத உணவுகள்** — முட்டை, சோயா, பருப்பு, சத்துமாவு
4. ⚡ **ப்ரீ/போஸ்ட் வொர்க்அவுட் உணவுகள்**

உங்களுக்கு இன்று என்ன தகவல் வேண்டும்?`;
    }

    if (isTanglish) {
      return `Vanakkam **${name}** bro! 🔥 Naan unga **RPEX AI Coach**.

Unga profile details ready ah irukku:
- 🎯 **Main Goal:** ${goal.toUpperCase()}
- ⚖️ **Weight:** ${weight} | **Daily Calorie Target:** ${targetCal} kcal
- 🥩 **Protein Target:** ${targetProt}g (Innum ${remProt}g reach pannanum)

Enakitta neenga enna venalum kekalam:
1. 🥗 Pre-workout & Post-workout la enna sapdanum?
2. 💰 Low budget high-protein foods list (Soy chunks, eggs, peanut, sundal)
3. 🏋️ Gym workout split & progressive overload guidance
4. 📈 Weight gain aagala na calories epdi increase pandradhu?

Enna doubt bro? Kelunga, solve pannuvom!`;
    }

    return `Hey **${name}**! 👋 Welcome. I'm your personal **RPEX AI Coach**.

Here is where you stand today:
- 🎯 **Primary Goal:** ${goal.toUpperCase()} (${experience.toUpperCase()})
- 📊 **Target Calories:** **${targetCal} kcal/day** (${consumedCal} kcal logged, **${remCal} kcal left**)
- 🥩 **Target Protein:** **${targetProt}g/day** (${consumedProt}g logged, **${remProt}g left**)
- 💧 **Water Target:** ${targets?.waterLiters || 3.2} Liters

How can I help you crush your goals today? You can ask me about meal plans, pre/post-workout fuel, budget protein options, or breaking plateaus!`;
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

  // 3. Pre-workout & Post-workout Nutrition
  if (/pre[- ]?workout|post[- ]?workout|before gym|after gym|before workout|after workout/i.test(lower)) {
    if (isTa) {
      return `### ⚡ உடற்பயிற்சிக்கு முன் மற்றும் பின் உணவு வழிகாட்டி (Pre & Post-Workout)

#### 1. உடற்பயிற்சிக்கு முன் (Pre-Workout - 45-60 நிமிடங்களுக்கு முன்):
- **நோக்கம்:** உடற்பயிற்சியின் போது அதிக ஆற்றல் (Fast Energy) கிடைப்பது.
- **பரிந்துரைகள்:**
  - 1 அல்லது 2 வாழைப்பழம் + 1 கப் பிளாக் காபி (Black Coffee)
  - 2 பிரெட் துண்டுகள் + 1 ஸ்பூன் வேர்க்கடலை வெண்ணெய் (Peanut Butter)
  - 40g ஓட்ஸ் + உலர் திராட்சை

#### 2. உடற்பயிற்சிக்கு பின் (Post-Workout - 30-45 நிமிடங்களுக்குள்):
- **நோக்கம்:** சேதமடைந்த தசைகளை சரிசெய்து வளர்ப்பது (Muscle Protein Synthesis).
- **பரிந்துரைகள்:**
  - 1 ஸ்கூப் வே புரோட்டீன் (Whey Protein) அல்லது 3-4 முட்டை வெள்ளைக்கரு (Egg Whites) + 1 வாழைப்பழம்
  - 100g பன்னீர் அல்லது 50g சோயா சங்க்ஸ் (Soy Chunks) + சாதம் / சப்பாத்தி
  - 150g சிக்கன் பிரெஸ்ட் (Chicken Breast) + சாதம்

💧 உடற்பயிற்சியின் போது போதுமான தண்ணீர் குடிப்பதை உறுதி செய்யுங்கள்!`;
    }

    if (isTanglish) {
      return `### ⚡ Gym Ku Munadi & Pinadi Enna Sapdanum? (Pre & Post-Workout Guide)

#### 1. Pre-Workout (Gym poradhukku 45 mins munnadi):
- **Goal:** Fast energy for heavy lifting & stamina!
- **Best options:**
  - 1 or 2 Banana + 1 cup Black Coffee (caffeine super energy tharum)
  - 2 slices Brown/White bread + 1 spoon Peanut butter
  - 40g Oats with warm water or light milk

#### 2. Post-Workout (Gym mudichu 30-45 mins kulla):
- **Goal:** Muscle repair and protein synthesis!
- **Best options:**
  - 1 scoop Whey Protein in water + 1 Banana (Fast digestion)
  - 3-4 Boiled Eggs (1 whole + 3 whites) + White rice / Roti
  - 50g Soy Chunks curry or 100g Paneer + Rice (Veg option)
  - 150g Grilled Chicken + Rice

Water nalla kudinga bro! Target: 3.5 Liters daily!`;
    }

    return `### ⚡ Optimal Pre & Post-Workout Fuel for ${name}

#### 1. Pre-Workout Window (45–60 minutes prior):
- **Objective:** Top off muscle glycogen and boost focus.
- **Top Choices:**
  - 1–2 Bananas + black coffee / espresso
  - 2 slices whole grain toast with 1 tbsp peanut butter
  - 40g Instant oats with berries
- *Keep fats low right before training to avoid slow gastric emptying.*

#### 2. Post-Workout Window (Within 45 minutes):
- **Objective:** Initiate muscle protein synthesis and replenish glycogen.
- **Top Choices:**
  - 1 scoop Whey Isolate or Plant Protein (24-27g protein) + 1 banana
  - 150g grilled chicken breast + 1 cup jasmine or brown rice
  - 50g boiled soy chunks (approx. 26g protein) + 2 rotis or rice
  - 4 egg whites + 1 whole egg omelette with toast

Your daily target is **${targetProt}g protein** and **${targetCal} kcal**—make sure this post-workout meal contributes around 25–35g of high-quality protein!`;
  }

  // 4. Protein without Whey / Budget Protein Sources
  if (/without whey|budget|affordable|cheap|low cost|whey illama|protein powder illama|veetla/i.test(lower)) {
    if (isTa) {
      return `### 💰 குறைந்த செலவில் புரோட்டீன் பவுடர் இல்லாமல் புரதம் பெறுவது எப்படி?

புரோட்டீன் பவுடர் கட்டாயம் இல்லை; நமது பாரம்பரிய உணவுகளிலேயே சிறந்த புரதம் உள்ளது:

1. **சோயா சங்க்ஸ் (Soy Chunks):**
   - 100g சோயா சங்க்ஸில் **52g புரதம்** உள்ளது! விலை மிகக் குறைவு (~₹15-20).
   - வாரத்தில் 3-4 நாட்கள் 40-50g சாப்பிடலாம்.
2. **முட்டை (Eggs):**
   - 1 முட்டையில் 6g புரதம். தினமும் 3-4 முட்டை சாப்பிட்டால் **18-24g புரதம்** மிகக் குறைந்த செலவில் கிடைக்கும்.
3. **வேர்க்கடலை & கொண்டைக்கடலை (Peanuts & Chickpeas/Sundal):**
   - 50g வறுத்த வேர்க்கடலையில் ~13g புரதம் + நல்ல கொழுப்பு உள்ளது.
   - வேகவைத்த சுண்டல் 100g = ~9g புரதம்.
4. **பாசிப்பருப்பு & உளுந்து (Moong Dal & Black Gram):**
   - பருப்பு சாதம், இட்லி, தோசை, மற்றும் சுண்டல்.
5. **சத்துமாவு (Sattu Powder):**
   - 2 கரண்டி சத்துமாவு மோரில் கலந்து குடித்தால் ~12-15g இயற்கை புரதம்.

உங்கள் இலக்கு **${targetProt}g**. இந்த உணவுகளை அன்றாடம் பிரித்து சாப்பிடுங்கள்!`;
    }

    if (isTanglish) {
      return `### 💰 Whey Protein Illama Low Budget la Protein Target Reach Pandradhu Epdi?

Protein powder illama natural food laye **${targetProt}g** protein easy ah reach pannalam bro:

1. **Soy Chunks (King of Veg Protein):**
   - 100g Soy Chunks = **52g pure protein**! Cost just ₹15-20.
   - Daily 40g-50g saptaale ~24g protein kedaikum.
2. **Boiled Eggs:**
   - 1 Whole Egg = 6g protein. Daily 4 eggs (1 full + 3 whites) = **20g high biological value protein**.
3. **Kadalai / Peanuts & Sundal:**
   - 50g Roasted peanuts = ~13g protein. Super budget energy snack!
   - 1 cup boiled Black/White channa = ~10g protein.
4. **Paneer / Curd (Thayir):**
   - 100g Paneer = ~18g protein.
   - 1 cup Thick Curd = ~8g protein with probiotics.
5. **Sattu Drink / Roasted Gram:**
   - 40g Pottukadalai powder buttermilk la mix panni kudicha ~10g instant protein.

Idha follow pannale unga monthly budget pocket-friendly ah irukkum!`;
    }

    return `### 💰 High-Protein Sources on a Budget (No Whey Powder Required)

You do **not** need expensive supplements to hit your **${targetProt}g** daily target. Real whole foods are cost-effective and nutrient-dense:

| Food Item | Portion | Protein Content | Approx Cost / Serving |
|---|---|---|---|
| **Soy Chunks** | 50g (dry) | ~26g | Very Low (~$0.15 / ₹12) |
| **Whole Eggs** | 4 eggs | ~24g | Low (~$0.50 / ₹28) |
| **Roasted Peanuts** | 50g | ~13g | Very Low (~$0.20 / ₹15) |
| **Lentils / Dal / Chickpeas** | 100g (cooked) | ~9–12g | Very Low (~$0.25 / ₹15) |
| **Cottage Cheese / Paneer** | 100g | ~18g | Moderate |
| **Greek Yogurt / Thick Curd** | 150g | ~10–14g | Low–Moderate |
| **Chicken Breast** | 150g | ~38g | Moderate |

**Coach Tip:** Distribute these across 3–4 meals (e.g., 25–35g protein per meal) to maximize muscle protein synthesis throughout the day!`;
  }

  // 5. Food Replacements / Substitutes (Chicken, Eggs, Milk, Paneer)
  if (/replace|substitute|alternative|chicken replace|egg replace|paneer replace|milk replace|instead of/i.test(lower)) {
    return `### 🔄 Nutritional Food Substitutions Guide

Need to replace a staple? Here are exact 1:1 macro-equivalent swaps:

- **Instead of 150g Chicken Breast (38g Protein, 180 kcal):**
  - 👉 **Soy Chunks:** 70g dry weight (36g protein, 240 kcal)
  - 👉 **Paneer / Cottage Cheese:** 200g (36g protein, 480 kcal - note higher fat)
  - 👉 **Fish (Tilapia / Salmon / Tuna):** 160g (36g protein, 190 kcal)
  - 👉 **Tofu (Firm):** 250g (38g protein, 200 kcal)

- **Instead of 4 Whole Eggs (24g Protein, 280 kcal):**
  - 👉 **120g Paneer or Tofu**
  - 👉 **1.5 cups Boiled Chickpeas or Black Beans** + 1 tbsp peanut butter
  - 👉 **1 scoop Whey/Plant Protein** + 10 almonds

- **Instead of Cow's Milk (Dairy-Free):**
  - 👉 **Soy Milk (High Protein):** 8g protein per 250ml cup (closest to dairy milk).
  - 👉 **Almond / Oat Milk:** Lower protein, so pair with a handful of pumpkin seeds or nuts.

Your current dietary preference is **${dietPref.replace(/_/g, ' ')}**. Use these swaps freely in your meal plan!`;
  }

  // 6. Portion Sizes: How much rice, chicken, or dal should I eat?
  if (/how much (rice|chicken|dal|food|quantity)|portion size|gram|grams of rice/i.test(lower)) {
    return `### ⚖️ Exact Portion Guide Tailored for Your ${targetCal} kcal Target

Based on your daily targets (**${targetCal} kcal, ${targetProt}g Protein, ${targetCarbs}g Carbs**), here is how to portion your staple foods:

- 🍚 **Rice (Cooked):**
  - **Muscle Gain / Bulking:** 150g–200g cooked per main meal (~200–260 kcal, 45–55g carbs).
  - **Fat Loss / Cutting:** 100g–120g cooked per meal (~130–160 kcal, 28–32g carbs).
- 🍗 **Chicken Breast:**
  - **Standard Serving:** 120g–150g raw weight per meal (~31–38g protein, 140–180 kcal).
- 🍲 **Dal / Lentils (Cooked):**
  - 1 bowl (approx. 150g cooked dal) provides ~9g protein and 20g carbs. Pair with rice or roti and a protein booster like paneer or egg.
- 🫓 **Roti / Chapati:**
  - 1 medium whole-wheat roti = ~80–90 kcal, 15g carbs, 3g protein.
  - Typical meal: 2–3 rotis for maintenance/muscle gain; 1–2 rotis for fat loss.
- 🥜 **Peanut Butter / Nuts:**
  - 1 tablespoon (16g) = ~95 kcal, 8g fat, 4g protein. Limit to 1–2 tablespoons daily.

Log these in your **Nutrition Log** tab today to see real-time updates of your consumed vs remaining macros!`;
  }

  // 7. Why am I not gaining weight / Plateau / Weight stopped changing
  if (/not gaining weight|can't gain|stuck weight|weight stops|stagnant|weight not moving/i.test(lower)) {
    return `### 📈 Breaking Through Weight Plateaus for ${name}

If your weight has stalled for more than 10–14 days, here is the scientific diagnosis:

1. **Your Energy Expenditure Has Caught Up (Metabolic Adaptation):**
   - As you train hard or gain initial mass, your Maintenance TDEE increases. What used to be a surplus is now your maintenance level (**~${targetCal} kcal**).
2. **The 300 kcal Rule:**
   - Add **+250 to +300 kcal per day** to your current intake.
   - *Easy practical additions:* 2 extra rotis, 1 banana with 2 tbsp peanut butter, or 40g roasted peanuts.
3. **Liquid Calories for Easy Digestion:**
   - If you feel too full, drink your calories: Blend 250ml milk, 1 banana, 30g oats, and 1 tbsp peanut butter (~450 kcal).
4. **Sleep & Recovery:**
   - Growth hormone and glycogen storage peak during deep sleep. Ensure at least 7.5 hours.

Let's adjust your target by 250 calories today if your scale average hasn't moved in 2 weeks!`;
  }

  // 8. Rest Days: What should I eat?
  if (/rest day|rest days|non-training day|off day/i.test(lower)) {
    return `### 🛋️ Rest Day Nutrition Protocol

**Myth:** You should drastically cut food on rest days.
**Reality:** Muscle tissue repair occurs primarily during the 24–48 hours *after* intense lifting!

- 🥩 **Keep Protein Identical:** Maintain your full **${targetProt}g protein** target to fuel ongoing repair.
- 🍚 **Slight Carbohydrate Adjustment:** You can optionally reduce carbohydrates slightly (by 20–30g) since energy output is lower, and replace with extra leafy greens and fiber.
- 💧 **Hydration:** Continue drinking **${targets?.waterLiters || 3.0} Liters** of water.
- 🧘 **Active Recovery:** Go for a relaxing 30-minute walk (5,000–8,000 steps) to clear metabolic waste and promote blood flow without fatiguing muscles.`;
  }

  // 9. General Calories, Protein & Nutrition Inquiries
  if (/nutrition|diet|eat|food|protein|calorie|macro|meal plan|shake|how much protein/i.test(lower)) {
    return `### 🥗 Precision Nutrition Targets for ${name}

Here is your calculated breakdown based on the **Mifflin-St Jeor** formula and your goal of **${goal.toUpperCase()}**:

- 🎯 **Daily Calorie Target:** **${targetCal} kcal**
  - *Estimated BMR:* ${targets?.bmr || Math.round(weightVal * 22)} kcal
  - *Estimated TDEE (Maintenance):* ${targets?.tdee || Math.round(targetCal * 0.9)} kcal
- 🥩 **Protein:** **${targetProt}g** (~${Math.round(targetProt * 4)} kcal, ${Math.round((targetProt * 4 / targetCal) * 100)}% of intake)
- 🍞 **Carbohydrates:** **${targetCarbs}g** (~${Math.round(targetCarbs * 4)} kcal, ${Math.round((targetCarbs * 4 / targetCal) * 100)}% of intake)
- 🥑 **Healthy Fats:** **${targetFats}g** (~${Math.round(targetFats * 9)} kcal, ${Math.round((targetFats * 9 / targetCal) * 100)}% of intake)
- 💧 **Water Requirement:** **${targets?.waterLiters || 3.2} Liters/day**

#### 📊 Today's Progress:
- **Calories:** ${consumedCal} / ${targetCal} kcal (**${remCal} kcal remaining**)
- **Protein:** ${consumedProt} / ${targetProt}g (**${remProt}g remaining**)

Check out your **Personalized Meal Plan** in the Nutrition tab to auto-log your breakfast, lunch, snacks, and dinner with one tap!`;
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
    ta: 'Tamil (தமிழ் script)',
    tanglish: 'Tanglish (Casual conversational Tamil written phonetically in English/Latin script, commonly spoken in Tamil Nadu with English fitness terms)',
    hi: 'Hindi',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    ar: 'Arabic',
    zh: 'Chinese (Mandarin)',
    ja: 'Japanese',
    ko: 'Korean',
    it: 'Italian',
    ru: 'Russian',
  };
  return languages[code] || 'English';
}
