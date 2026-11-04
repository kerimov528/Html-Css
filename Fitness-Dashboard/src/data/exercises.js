// Hərəkət kitabxanası, məşq günləri və fazalar.
// Qayda: yerdə uzanaraq edilən hərəkət yoxdur — hamısı trenajor, kabel, skamya və ya ayaq üstə.

export const MUSCLES = {
  chest: 'Böyük sinə (orta/alt)',
  chest_upper: 'Üst sinə',
  delts_front: 'Ön çiyin (deltoid)',
  delts_side: 'Yan çiyin',
  delts_rear: 'Arxa çiyin',
  biceps: 'Biseps',
  triceps: 'Triseps',
  forearms: 'Ön qol (bilək)',
  abs: 'Düz qarın (press)',
  obliques: 'Çəp qarın',
  traps: 'Trapesiya',
  upper_back: 'Kürək ortası',
  lats: 'Enli kürək (lats)',
  lower_back: 'Bel əzələləri',
  glutes: 'Sağrı',
  quads: 'Bud önü (kvadriseps)',
  hamstrings: 'Bud arxası',
  adductors: 'Bud içi',
  calves: 'Baldır',
};

// eq: avadanlıq; p: əsas işləyən əzələlər; s: köməkçi əzələlər
export const EX = {
  // ---------- İSİNMƏ ----------
  treadmill_incline: {
    az: 'Meyilli zolaqda yeriş', en: 'Incline Treadmill Walk', eq: 'Kardio aləti',
    p: ['calves', 'glutes'], s: ['quads', 'hamstrings'],
    cues: ['Meyil 6–10%, sürət 4.5–5.5 km/saat.', 'Tutacaqlardan yapışma — qollar sərbəst yellənsin.', 'Yüngül tərləyənə qədər davam et; danışa bilməlisən.'],
    err: ['Tutacaqdan yapışıb geriyə əyilmək yükü yarıya endirir.'],
  },
  stationary_bike: {
    az: 'Velotrenajor', en: 'Stationary Bike', eq: 'Kardio aləti',
    p: ['quads'], s: ['glutes', 'hamstrings', 'calves'],
    cues: ['Oturacağı elə qur ki, pedal ən aşağıda olanda diz azca bükülü qalsın.', 'Dəqiqədə 80–90 dövr, yüngül müqavimət.', 'Dizlər ayaq barmaqları istiqamətində hərəkət etsin.'],
    err: ['Oturacaq çox alçaq olanda diz oynağı sıxılır.'],
  },
  elliptical: {
    az: 'Ellips trenajoru', en: 'Elliptical Trainer', eq: 'Kardio aləti',
    p: ['quads', 'glutes'], s: ['hamstrings', 'calves', 'chest', 'lats'],
    cues: ['Tutacaqları it-çək, ayaqlar dabandan itələsin.', 'Gövdə dik, qarın yüngül sıxılı.', 'Orta tempdə, nəfəs açıq qalsın.'],
    err: ['Bütün çəkini tutacaqlara vermək.'],
  },
  rower: {
    az: 'Avarçəkmə trenajoru', en: 'Rowing Machine', eq: 'Kardio aləti',
    p: ['lats', 'quads'], s: ['upper_back', 'hamstrings', 'biceps', 'glutes'],
    cues: ['Ardıcıllıq: ayaqlar → gövdə → qollar; qayıdış əksinə.', 'Kürək düz, çiyinlər aşağı.', 'Dəqiqədə 18–22 avar, yüngül templə.'],
    err: ['Ayaqları itələmədən qollarla dartmaq.'],
  },
  face_pull: {
    az: 'Kabel face pull (yüngül)', en: 'Cable Face Pull', eq: 'Kabel (blok)',
    p: ['delts_rear', 'upper_back'], s: ['traps', 'biceps'],
    cues: ['Kabeli göz səviyyəsinə qur, kəndir tutacaq tax.', 'Tutacağı üzünə doğru çək, dirsəkləri yuxarı-yana aç.', 'Sonda 1 saniyə saxla, kürəkləri bir-birinə sıx.'],
    err: ['Ağır çəki götürüb gövdəni arxaya atmaq.'],
  },
  band_pull_apart: {
    az: 'Rezin lentlə yana açma', en: 'Band Pull-Apart', eq: 'Rezin lent',
    p: ['delts_rear', 'upper_back'], s: ['traps'],
    cues: ['Qollar çiyin hündürlüyündə, düz.', 'Lenti sinəyə toxunana qədər yanlara dart.', 'Çiyinləri qulaqlara qaldırma.'],
    err: ['Dirsəkləri çox bükmək — arxa çiyin işləmir.'],
  },
  band_dislocate: {
    az: 'Lent və ya çubuqla çiyin dövrəsi', en: 'Band Shoulder Dislocate', eq: 'Rezin lent / çubuq',
    p: ['delts_front', 'delts_rear'], s: ['chest', 'traps'],
    cues: ['Geniş tutuşla lenti başın üstündən arxaya apar və geri qaytar.', 'Dirsəklər düz qalsın, ağrısız amplitudada işlə.', '10 təkrar, yavaş templə.'],
    err: ['Dar tutuşla məcburən arxaya keçirmək.'],
  },
  reverse_pec_deck: {
    az: 'Əks pec-deck (arxa çiyin)', en: 'Reverse Pec Deck', eq: 'Trenajor',
    p: ['delts_rear'], s: ['upper_back', 'traps'],
    cues: ['Sinən dayağa söykənsin, tutacaqlar çiyin hündürlüyündə.', 'Qolları azca bükülü saxlayaraq geriyə aç.', 'Nəzarətlə qayıt, çiyinləri qaldırma.'],
    err: ['Çəkini yelləyərək atmaq.'],
  },
  box_squat_bench: {
    az: 'Skamyaya oturub-qalxma', en: 'Bodyweight Box Squat', eq: 'Skamya',
    p: ['quads', 'glutes'], s: ['hamstrings', 'adductors'],
    cues: ['Skamyanın qarşısında ayaqlar çiyin enində dur.', 'Kalçanı geri ver, skamyaya yüngülcə toxun — çökmə.', 'Dabanla itələyib qalx.'],
    err: ['Dizlərin içəri çökməsi.'],
  },
  leg_swings: {
    az: 'Ayaq yelləmə (dayaqdan tutaraq)', en: 'Leg Swings', eq: 'Dayaq (rack)',
    p: ['hamstrings', 'adductors'], s: ['glutes', 'quads'],
    cues: ['Bir əllə dayaqdan tut.', 'Ayağı 10 dəfə irəli-geri, sonra 10 dəfə yana yellə.', 'Gövdə dik qalsın, amplitudanı tədricən artır.'],
    err: ['Beldən əyilərək yelləmək.'],
  },
  bw_lunge: {
    az: 'Çəkisiz addım-lunge', en: 'Bodyweight Walking Lunge', eq: 'Çəkisiz',
    p: ['quads', 'glutes'], s: ['hamstrings', 'adductors'],
    cues: ['Uzun addım at, arxa diz yerə yaxınlaşsın, amma toxunmasın.', 'Ön diz ayaq barmaqları istiqamətində.', 'Hər ayağa 8 addım.'],
    err: ['Ön dizin içəri düşməsi.'],
  },
  hip_hinge_dowel: {
    az: 'Çubuqla omba menteşəsi', en: 'Dowel Hip Hinge', eq: 'Çubuq',
    p: ['hamstrings', 'glutes'], s: ['lower_back'],
    cues: ['Çubuğu kürəyinə qoy: baş, kürəyin üstü və büzdüm ona toxunsun.', 'Kalçanı geri itələ, dizlər azca bükülü.', 'Bud arxasında dartılma hiss edəndə qalx.'],
    err: ['Çubuqdan ayrılmaq — bel yuvarlanır.'],
  },

  // ---------- SİNƏ ----------
  db_bench: {
    az: 'Hantellə düz skamyada press', en: 'Dumbbell Bench Press', eq: 'Hantel + skamya',
    p: ['chest'], s: ['delts_front', 'triceps', 'chest_upper'],
    cues: ['Skamyada uzan, ayaqlar yerdə möhkəm, kürəklər geri-aşağı sıxılı.', 'Hantelləri sinə səviyyəsinə endir, dirsəklər gövdəyə 45–60° bucaqla.', 'Yuxarı itələ, hantelləri bir-birinə vurma.', 'Endirmə 2 saniyə, qaldırma güclü və nəzarətli.'],
    err: ['Dirsəkləri 90° yana açmaq — çiyin oynağını yükləyir.', 'Ombanı skamyadan qaldırmaq.'],
  },
  machine_chest_press: {
    az: 'Sinə press trenajoru', en: 'Machine Chest Press', eq: 'Trenajor',
    p: ['chest'], s: ['delts_front', 'triceps'],
    cues: ['Oturacağı elə qur ki, tutacaqlar sinənin orta xəttində olsun.', 'Kürəklər dayağa sıxılı, sinə önə.', 'İtələ, dirsəkləri tam kilidləmə; 2 saniyəyə qayıt.'],
    err: ['Oturacaq çox hündür olanda yük çiyinə keçir.'],
  },
  smith_bench: {
    az: 'Smit maşınında düz press', en: 'Smith Machine Bench Press', eq: 'Smit maşını + skamya',
    p: ['chest'], s: ['delts_front', 'triceps'],
    cues: ['Skamyanı elə yerləşdir ki, ştanq döşün alt hissəsinə ensin.', 'Təhlükəsizlik dayaqlarını sinədən bir az aşağı qur.', 'Tutuş çiyin enindən bir qədər geniş, biləklər düz.'],
    err: ['Ştanqı boyuna doğru endirmək.'],
  },
  bb_bench: {
    az: 'Ştanqla düz skamyada press', en: 'Barbell Bench Press', eq: 'Ştanq + skamya',
    p: ['chest'], s: ['delts_front', 'triceps'],
    cues: ['Gözlər ştanqın altında, kürəklər sıxılı, beldə yüngül qövs.', 'Ştanqı döşün alt xəttinə endir, biləklər düz.', 'Ayaqlarla yerə itələ, ştanqı azca gözlər istiqamətinə qaldır.', 'Tək məşq edəndə təhlükəsizlik dayağı və ya köməkçi mütləqdir.'],
    err: ['Ştanqı sinədən sıçratmaq.', 'Ombanı skamyadan qaldırmaq.'],
  },
  pec_deck: {
    az: 'Pec-deck (kəpənək)', en: 'Pec Deck Fly', eq: 'Trenajor',
    p: ['chest'], s: ['delts_front', 'chest_upper'],
    cues: ['Tutacaqlar sinə hündürlüyündə, dirsəklər azca bükülü.', 'Qolları qucaqlayırmış kimi önə gətir, sinəni 1 saniyə sıx.', 'Geri açılanda sinədə dartılma hiss et, çiyinləri önə yuvarlatma.'],
    err: ['Arxaya həddindən çox açılıb çiyni dartmaq.'],
  },
  cable_crossover: {
    az: 'Kabel krossover (yuxarıdan aşağı)', en: 'Cable Crossover (High-to-Low)', eq: 'Kabel (blok)',
    p: ['chest'], s: ['delts_front'],
    cues: ['Kabelləri çiyindən yuxarı qur, bir addım önə çıx.', 'Əlləri qövs boyunca göbək səviyyəsinə gətir.', 'Gövdə azca önə əyilmiş, dirsəklərin bucağı dəyişməsin.'],
    err: ['Dirsəkləri bükərək hərəkəti presə çevirmək.'],
  },
  low_high_cable_fly: {
    az: 'Aşağıdan yuxarı kabel fly', en: 'Low-to-High Cable Fly', eq: 'Kabel (blok)',
    p: ['chest_upper'], s: ['delts_front', 'chest'],
    cues: ['Kabelləri ən aşağı nöqtəyə qur.', 'Əlləri qövslə çənə səviyyəsinə qaldır, ovuclar yuxarı baxsın.', 'Üst sinədə sıxılmanı 1 saniyə saxla.'],
    err: ['Çiyinləri qaldırmaq — yük trapesiyaya keçir.'],
  },
  incline_db_fly: {
    az: 'Meyilli skamyada hantel fly', en: 'Incline Dumbbell Fly', eq: 'Hantel + skamya',
    p: ['chest_upper', 'chest'], s: ['delts_front'],
    cues: ['Skamya 30°.', 'Hantelləri geniş qövslə endir, dirsəklər azca bükülü.', 'Sinədə dartılma hiss edəndə dayan, eyni qövslə qaldır.'],
    err: ['Ağır çəki götürüb hərəkəti presə çevirmək.'],
  },
  incline_db_press: {
    az: 'Meyilli skamyada hantel press', en: 'Incline Dumbbell Press', eq: 'Hantel + skamya',
    p: ['chest_upper'], s: ['delts_front', 'triceps', 'chest'],
    cues: ['Skamya 30° (45° çiyinə çox yük verir).', 'Hantelləri üst sinəyə endir, dirsəklər gövdədən azca aşağı.', 'Yuxarı itələyərkən kürəkləri skamyaya sıx.'],
    err: ['Skamyanı çox dik qurmaq — hərəkət çiyin pressinə çevrilir.'],
  },
  incline_machine_press: {
    az: 'Meyilli sinə press trenajoru', en: 'Incline Machine Press', eq: 'Trenajor',
    p: ['chest_upper'], s: ['delts_front', 'triceps'],
    cues: ['Tutacaqlar köprücük sümüyü ilə döş arası səviyyədə olsun.', 'Kürəklər dayaqda sıxılı, sinə yuxarı.', 'İtələ və 2 saniyəyə qayıt.'],
    err: ['Beli dayaqdan ayırmaq.'],
  },
  incline_smith_press: {
    az: 'Smit maşınında meyilli press', en: 'Incline Smith Press', eq: 'Smit maşını + skamya',
    p: ['chest_upper'], s: ['delts_front', 'triceps'],
    cues: ['Skamya 30°, ştanq üst sinəyə ensin.', 'Təhlükəsizlik dayaqlarını qur.', 'Tutuş çiyin enindən bir qədər geniş.'],
    err: ['Ştanqı boyuna doğru endirmək.'],
  },
  incline_bb_press: {
    az: 'Ştanqla meyilli press', en: 'Incline Barbell Press', eq: 'Ştanq + skamya',
    p: ['chest_upper'], s: ['delts_front', 'triceps'],
    cues: ['Skamya 30°, kürəklər sıxılı.', 'Ştanqı köprücük sümüyünün bir az altına endir.', 'Köməkçi və ya təhlükəsizlik dayağı ilə işlə.'],
    err: ['Dirsəkləri tam yana açmaq.'],
  },

  // ---------- AYAQ ----------
  leg_press: {
    az: 'Ayaq pressi (45°)', en: 'Leg Press', eq: 'Trenajor',
    p: ['quads', 'glutes'], s: ['adductors', 'hamstrings'],
    cues: ['Ayaqlar platformanın ortasında, çiyin enində.', 'Dizlər təxminən 90°-yə qədər en; bel oturacaqdan qalxmasın.', 'Dabanlarla itələ, dizləri tam kilidləmə.'],
    err: ['Dizlərin içəri çökməsi.', 'Çox dərin enib belin yuvarlanması.'],
  },
  hack_squat: {
    az: 'Hak squat trenajoru', en: 'Hack Squat Machine', eq: 'Trenajor',
    p: ['quads'], s: ['glutes', 'adductors'],
    cues: ['Kürək və çiyinlər yastıqlara tam söykənsin.', 'Nəzarətlə en, budlar platformaya paralel olana qədər.', 'Ayağın ortası və dabanla itələ.'],
    err: ['Dabanların platformadan qalxması.'],
  },
  goblet_squat: {
    az: 'Hantellə qoblet squat', en: 'Goblet Squat', eq: 'Hantel',
    p: ['quads', 'glutes'], s: ['adductors', 'abs'],
    cues: ['Hanteli sinəyə yaxın, şaquli tut.', 'Ayaqlar çiyin enindən bir az geniş, barmaqlar azca çölə.', 'Dirsəklər dizlərin arasına enənə qədər otur, sinə dik qalsın.'],
    err: ['Dabanların qalxması — dabanların altına nazik disk qoya bilərsən.'],
  },
  smith_squat: {
    az: 'Smit maşınında squat', en: 'Smith Machine Squat', eq: 'Smit maşını',
    p: ['quads', 'glutes'], s: ['hamstrings', 'adductors'],
    cues: ['Ayaqları ştanqın xəttindən azca önə qoy.', 'Ştanq trapesiyanın üstündə, əllər möhkəm tutsun.', 'Budlar paralelə qədər en, dizlər ayaq istiqamətində.'],
    err: ['Ayaqları ştanqın düz altına qoymaq — dizə artıq yük.'],
  },
  db_rdl: {
    az: 'Hantellə rumın dartışı (RDL)', en: 'Dumbbell Romanian Deadlift', eq: 'Hantel',
    p: ['hamstrings', 'glutes'], s: ['lower_back', 'forearms'],
    cues: ['Hantellər budların qarşısında, dizlər azca bükülü.', 'Kalçanı geri itələyərək hantelləri ayaq boyu aşağı sürüşdür.', 'Kürək düz; bud arxasında güclü dartılma hiss edəndə dayan.', 'Kalçanı önə itələyib qalx, sağrını sıx.'],
    err: ['Belin yuvarlanması.', 'Squat kimi dizləri çox bükmək.'],
  },
  bb_rdl: {
    az: 'Ştanqla rumın dartışı', en: 'Barbell Romanian Deadlift', eq: 'Ştanq',
    p: ['hamstrings', 'glutes'], s: ['lower_back', 'forearms', 'traps'],
    cues: ['Ştanq budlara yaxın hərəkət etsin.', 'Kalça geri, kürək düz, baş neytral.', 'Diz altına qədər en, sağrı ilə qalx.'],
    err: ['Ştanqı bədəndən uzaqlaşdırmaq.'],
  },
  smith_rdl: {
    az: 'Smit maşınında RDL', en: 'Smith Machine RDL', eq: 'Smit maşını',
    p: ['hamstrings', 'glutes'], s: ['lower_back'],
    cues: ['Ştanqın xətti ayaq ortasının üstündə olsun.', 'Kalçanı geri itələ, ştanq budlara yaxın ensin.', 'Bud arxası dartılanda dayan və qalx.'],
    err: ['Aşağıda beli boşaltmaq.'],
  },
  back_extension_45: {
    az: '45° bel ekstenziyası', en: '45° Back Extension', eq: 'Hiperekstenziya skamyası',
    p: ['glutes', 'hamstrings'], s: ['lower_back'],
    cues: ['Yastıq çanaq sümüyünün dərhal altında olsun.', 'Kürək düz şəkildə ombadan aşağı əyil.', 'Sağrını sıxaraq bədənlə düz xətt alınana qədər qalx — geriyə artıq əyilmə.'],
    err: ['Yuxarıda beli həddindən çox bükmək.'],
  },
  seated_leg_curl: {
    az: 'Oturaq bud arxası bükmə', en: 'Seated Leg Curl', eq: 'Trenajor',
    p: ['hamstrings'], s: ['calves'],
    cues: ['Diz oynağı trenajorun fırlanma oxu ilə üst-üstə olsun.', 'Bud yastığını möhkəm sıx.', 'Dabanı aşağı-arxaya bük, 1 saniyə saxla, 3 saniyəyə qaytar.'],
    err: ['Ombanı oturacaqdan qaldırmaq.'],
  },
  lying_leg_curl: {
    az: 'Üzüqoylu bud arxası bükmə (trenajorda)', en: 'Lying Leg Curl', eq: 'Trenajor',
    p: ['hamstrings'], s: ['calves'],
    cues: ['Trenajorun yastığı üzərində uzan (yerdə deyil).', 'Ombanı yastığa basılı saxla.', 'Dabanı sağrıya doğru bük, yavaş endir.'],
    err: ['Ombanı yuxarı qaldırıb yelləmək.'],
  },
  standing_leg_curl: {
    az: 'Ayaq üstə tək ayaqla bükmə', en: 'Standing Single-Leg Curl', eq: 'Trenajor / kabel',
    p: ['hamstrings'], s: ['calves'],
    cues: ['Budu yastığa söykə, tutacaqlardan tut.', 'Dabanı sağrıya doğru bük.', 'Hər ayağa ayrıca, yavaş qaytar.'],
    err: ['Beldən əyilib kömək almaq.'],
  },
  leg_extension: {
    az: 'Ayaq açma (leg extension)', en: 'Leg Extension', eq: 'Trenajor',
    p: ['quads'], s: [],
    cues: ['Diz trenajorun oxu ilə üst-üstə, yastıq topuğun üstündə.', 'Ayağı tam aç, budu 1 saniyə sıx.', '3 saniyəyə endir.'],
    err: ['Çəkini atıb-tutmaq — dizə zərbə.'],
  },
  bulgarian_split_squat: {
    az: 'Bolqar split squat (skamya ilə)', en: 'Bulgarian Split Squat', eq: 'Hantel + skamya',
    p: ['quads', 'glutes'], s: ['adductors', 'hamstrings'],
    cues: ['Arxa ayağın barmaqlarını skamyaya qoy.', 'Ön ayaqla düz aşağı en, gövdə azca önə.', 'Ön dabanla itələyib qalx; əvvəl çəkisiz balansı öyrən.'],
    err: ['Ön ayağı skamyaya çox yaxın qoymaq.'],
  },
  db_walking_lunge: {
    az: 'Hantellə yeriş-lunge', en: 'Dumbbell Walking Lunge', eq: 'Hantel',
    p: ['quads', 'glutes'], s: ['hamstrings', 'adductors', 'forearms'],
    cues: ['Hər əldə hantel, gövdə dik.', 'Uzun addım, arxa diz yerə yaxın ensin.', 'Ön dabanla itələyib növbəti addıma keç.'],
    err: ['Qısa addım — diz barmaqları çox keçir.'],
  },
  smith_split_squat: {
    az: 'Smit maşınında split squat', en: 'Smith Split Squat', eq: 'Smit maşını',
    p: ['quads', 'glutes'], s: ['adductors'],
    cues: ['Bir ayaq önə, bir ayaq arxaya — ştanq trapesiyada.', 'Düz aşağı en, ön diz ayaq istiqamətində.', 'Hər ayağa ayrıca set.'],
    err: ['Gövdəni yana əymək.'],
  },

  // ---------- KÜRƏK ----------
  seated_cable_row: {
    az: 'Oturaq kabel dartışı', en: 'Seated Cable Row', eq: 'Kabel (blok)',
    p: ['upper_back', 'lats'], s: ['biceps', 'delts_rear', 'forearms'],
    cues: ['Dizlər azca bükülü, gövdə dik.', 'Tutacağı göbəyə doğru çək, dirsəklər gövdəyə yaxın.', 'Kürəkləri bir-birinə sıx, sonra qolları nəzarətlə uzat.'],
    err: ['Gövdəni irəli-geri yelləmək.'],
  },
  chest_supported_row: {
    az: 'Sinə dayaqlı dartış trenajoru', en: 'Chest-Supported Machine Row', eq: 'Trenajor',
    p: ['upper_back', 'lats'], s: ['biceps', 'delts_rear'],
    cues: ['Sinəni yastığa söykə, beli rahat saxla.', 'Dirsəkləri arxaya apar, kürəkləri sıx.', '1 saniyə saxla, tam uzanaraq qayıt.'],
    err: ['Sinəni yastıqdan ayırmaq.'],
  },
  db_row_bench: {
    az: 'Skamyada tək əllə hantel dartışı', en: 'One-Arm Dumbbell Row', eq: 'Hantel + skamya',
    p: ['lats', 'upper_back'], s: ['biceps', 'delts_rear'],
    cues: ['Bir əl və bir diz skamyada, kürək düz.', 'Hanteli ombaya doğru çək — qolu deyil, dirsəyi düşün.', 'Aşağıda kürəyin dartılmasına icazə ver.'],
    err: ['Gövdəni fırladaraq çəkmək.'],
  },
  tbar_row: {
    az: 'T-ştanq dartışı (sinə dayaqlı)', en: 'Chest-Supported T-Bar Row', eq: 'Trenajor',
    p: ['upper_back', 'lats'], s: ['biceps', 'delts_rear', 'traps'],
    cues: ['Sinəni dayağa söykə, ayaqlar möhkəm.', 'Tutacağı sinənin altına doğru çək.', 'Kürəkləri sıx, yavaş endir.'],
    err: ['Çiyinləri qulağa qaldırmaq.'],
  },
  lat_pulldown: {
    az: 'Üst blok dartışı (lat pulldown)', en: 'Lat Pulldown', eq: 'Kabel (blok)',
    p: ['lats'], s: ['biceps', 'upper_back', 'delts_rear'],
    cues: ['Budları yastığın altına möhkəm yerləşdir.', 'Tutuş çiyin enindən bir qədər geniş.', 'Sinəni qaldır, tutacağı köprücük sümüyünə çək — dirsəklər aşağı, ciblərə.', 'Yuxarıda latsın tam açılmasına icazə ver.'],
    err: ['Arxaya çox yatmaq.', 'Ensənin arxasına çəkmək.'],
  },
  assisted_pullup: {
    az: 'Köməkçi trenajorda turnik', en: 'Assisted Pull-Up Machine', eq: 'Trenajor',
    p: ['lats'], s: ['biceps', 'upper_back', 'forearms'],
    cues: ['Dizləri platformaya qoy; kömək çəkisi çox olduqca hərəkət asanlaşır.', 'Çənə tutacaqdan yuxarı qalxana qədər dart.', 'Tam uzanaraq en. Hər ay kömək çəkisini azalt.'],
    err: ['Yarım amplituda ilə işləmək.'],
  },
  machine_pulldown: {
    az: 'Diskli pulldown trenajoru', en: 'Machine Pulldown (Plate-Loaded)', eq: 'Trenajor',
    p: ['lats'], s: ['biceps', 'upper_back'],
    cues: ['Oturacağı elə qur ki, tutacaqlara güclə çatasan.', 'Dirsəkləri aşağı-arxaya çək.', 'Yavaş qayıt, çiyinlər tam açılsın.'],
    err: ['Gövdəni geriyə ataraq çəkmək.'],
  },
  single_arm_pulldown: {
    az: 'Tək əllə kabel pulldown', en: 'Single-Arm Cable Pulldown', eq: 'Kabel (blok)',
    p: ['lats'], s: ['biceps', 'obliques'],
    cues: ['Oturaq və ya ayaq üstə, kabel yuxarıda.', 'Dirsəyi ombaya doğru çək.', 'Hər tərəfə ayrıca set, yuxarıda tam dartıl.'],
    err: ['Gövdəni yana əymək.'],
  },

  // ---------- ÇİYİN ----------
  db_shoulder_press: {
    az: 'Oturaq hantel çiyin pressi', en: 'Seated Dumbbell Shoulder Press', eq: 'Hantel + skamya',
    p: ['delts_front'], s: ['delts_side', 'triceps', 'chest_upper'],
    cues: ['Skamyanın arxalığı 80–90°.', 'Hantellər qulaq səviyyəsində, dirsəklər azca önə.', 'Başın üstünə itələ, beli dayaqdan ayırma.'],
    err: ['Beli həddindən çox qövs etmək.'],
  },
  machine_shoulder_press: {
    az: 'Çiyin press trenajoru', en: 'Machine Shoulder Press', eq: 'Trenajor',
    p: ['delts_front'], s: ['delts_side', 'triceps'],
    cues: ['Tutacaqlar çiyin səviyyəsində başlasın.', 'Kürək dayaqda, qarın sıxılı.', 'İtələ, yavaş qayıt.'],
    err: ['Dirsəkləri tam kilidləyib sıçratmaq.'],
  },
  smith_shoulder_press: {
    az: 'Smit maşınında oturaq çiyin pressi', en: 'Smith Seated Shoulder Press', eq: 'Smit maşını + skamya',
    p: ['delts_front'], s: ['delts_side', 'triceps'],
    cues: ['Skamyanı ştanq çənənin önündən enəcək şəkildə qur.', 'Ştanqı çənə səviyyəsinə endir.', 'Başın üstünə itələ.'],
    err: ['Ştanqı ensəyə endirmək.'],
  },
  landmine_press: {
    az: 'Landmayn press (ayaq üstə)', en: 'Landmine Press', eq: 'Ştanq + landmayn',
    p: ['delts_front', 'chest_upper'], s: ['triceps', 'abs'],
    cues: ['Ştanqın ucunu çiyin önündə tut.', 'Yuxarı-önə itələ, qarnı sıx.', 'Hər əllə ayrıca və ya iki əllə. Çiyinlər üçün ən rahat variant.'],
    err: ['Beli arxaya əymək.'],
  },
  cable_lateral: {
    az: 'Kabellə yana qaldırma', en: 'Cable Lateral Raise', eq: 'Kabel (blok)',
    p: ['delts_side'], s: ['traps'],
    cues: ['Kabel ən aşağıda; kabeli bədənin önündən keçir.', 'Dirsəkdən başlayaraq qolu çiyin hündürlüyünə qaldır.', 'Çiyni qulağa qaldırma, 3 saniyəyə endir.'],
    err: ['Çəkini bədənlə yelləmək.'],
  },
  db_lateral: {
    az: 'Hantellə yana qaldırma', en: 'Dumbbell Lateral Raise', eq: 'Hantel',
    p: ['delts_side'], s: ['traps'],
    cues: ['Yüngül hantel, gövdə azca önə.', 'Qolları yanlara çiyin hündürlüyünə qaldır, kiçik barmaq azca yuxarı.', 'Yavaş endir.'],
    err: ['Ağır hantel götürüb trapesiya ilə qaldırmaq.'],
  },
  machine_lateral: {
    az: 'Yana qaldırma trenajoru', en: 'Machine Lateral Raise', eq: 'Trenajor',
    p: ['delts_side'], s: ['traps'],
    cues: ['Çiyin oynağı trenajorun oxu ilə üst-üstə.', 'Yastıqları dirsəklərlə yuxarı it.', 'Yuxarıda 1 saniyə saxla.'],
    err: ['Oturacağı yanlış qurmaq — hərəkət əyri gedir.'],
  },
  cable_y_raise: {
    az: 'Kabel Y-qaldırma', en: 'Cable Y-Raise', eq: 'Kabel (blok)',
    p: ['delts_side'], s: ['traps', 'delts_rear'],
    cues: ['İki kabel aşağıda, çarpaz tut.', 'Qolları Y hərfi kimi yuxarı-yana qaldır.', 'Yüngül çəki, nəzarətli temp.'],
    err: ['Çiyinləri qaldırmaq.'],
  },

  // ---------- BİSEPS ----------
  ez_curl: {
    az: 'EZ-ştanqla biseps', en: 'EZ-Bar Curl', eq: 'EZ-ştanq',
    p: ['biceps'], s: ['forearms'],
    cues: ['Dirsəklər gövdənin yanında sabit.', 'Ştanqı çiyinə doğru bük, yuxarıda sıx.', '3 saniyəyə endir, bədəni yelləmə.'],
    err: ['Beldən yelləyərək qaldırmaq.'],
  },
  db_curl: {
    az: 'Hantellə biseps (supinasiya)', en: 'Dumbbell Curl', eq: 'Hantel',
    p: ['biceps'], s: ['forearms'],
    cues: ['Ovuc içəri baxaraq başla, qaldırdıqca yuxarı çevir.', 'Dirsəklər sabit, yalnız ön qol hərəkət etsin.', 'Növbə ilə və ya eyni anda.'],
    err: ['Dirsəkləri irəli aparmaq.'],
  },
  cable_curl: {
    az: 'Kabellə biseps', en: 'Cable Curl', eq: 'Kabel (blok)',
    p: ['biceps'], s: ['forearms'],
    cues: ['Kabel aşağıda, düz və ya EZ tutacaq.', 'Dirsəklər gövdədə sabit.', 'Bütün amplitudada gərginlik qalır — yavaş işlə.'],
    err: ['Gövdəni arxaya atmaq.'],
  },
  preacher_curl: {
    az: 'Skot skamyasında / trenajorda biseps', en: 'Preacher Curl', eq: 'Skot skamyası / trenajor',
    p: ['biceps'], s: ['forearms'],
    cues: ['Qoltuq altı yastığın üst kənarına söykənsin.', 'Qaldır və yuxarıda sıx.', 'Aşağıda qolu tam açma, dirsəkdə yüngül bükülü dayan.'],
    err: ['Aşağıda çəkini buraxıb dirsəyi dartmaq.'],
  },
  incline_db_curl: {
    az: 'Meyilli skamyada hantel biseps', en: 'Incline Dumbbell Curl', eq: 'Hantel + skamya',
    p: ['biceps'], s: ['forearms'],
    cues: ['Skamya 45–60°, qollar sərbəst arxaya asılsın.', 'Dirsəklər irəli getməsin, yalnız ön qol hərəkət etsin.', 'Aşağıda bisepsin tam dartılmasını hiss et.'],
    err: ['Çiyinləri önə yuvarlatmaq.'],
  },
  bayesian_curl: {
    az: 'Bayesian kabel biseps', en: 'Bayesian Cable Curl', eq: 'Kabel (blok)',
    p: ['biceps'], s: ['forearms'],
    cues: ['Kabelə arxanı çevir, kabel aşağıda; bir addım önə çıx.', 'Qol bədəndən arxada başlasın — biseps uzanmış vəziyyətdə.', 'Dirsəyi sabit saxlayaraq bük. Hər qola ayrıca.'],
    err: ['Dirsəyi önə gətirmək.'],
  },
  hammer_curl: {
    az: 'Çəkic biseps (hammer curl)', en: 'Hammer Curl', eq: 'Hantel',
    p: ['biceps', 'forearms'], s: [],
    cues: ['Ovuclar bir-birinə baxsın (neytral tutuş).', 'Dirsəklər sabit, hanteli çiyinə doğru qaldır.', 'Qolun qalınlığı üçün brachialis və ön qol işləyir.'],
    err: ['Yelləmə ilə qaldırmaq.'],
  },
  rope_hammer_curl: {
    az: 'Kəndirlə kabel hammer curl', en: 'Rope Cable Hammer Curl', eq: 'Kabel (blok)',
    p: ['biceps', 'forearms'], s: [],
    cues: ['Kəndir tutacaq aşağıda, neytral tutuş.', 'Dirsəklər gövdədə, kəndiri çiyinlərə doğru bük.', 'Yavaş endir.'],
    err: ['Biləkləri bükmək.'],
  },

  // ---------- TRİSEPS ----------
  rope_pushdown: {
    az: 'Kəndirlə triseps itələmə', en: 'Rope Triceps Pushdown', eq: 'Kabel (blok)',
    p: ['triceps'], s: [],
    cues: ['Dirsəklər gövdəyə yapışıq, sabit.', 'Kəndiri aşağı itələ, sonda ucları yanlara aç.', 'Yuxarı qayıdanda dirsəklər irəli getməsin.'],
    err: ['Gövdə ilə üstünə yatıb basmaq.'],
  },
  bar_pushdown: {
    az: 'V və ya düz tutacaqla pushdown', en: 'Bar Triceps Pushdown', eq: 'Kabel (blok)',
    p: ['triceps'], s: [],
    cues: ['Tutacaq sinə səviyyəsində başlasın.', 'Dirsəklər sabit, qolları tam aç.', 'Aşağıda 1 saniyə sıx.'],
    err: ['Dirsəkləri yana açmaq.'],
  },
  machine_triceps_ext: {
    az: 'Triseps trenajoru (oturaq)', en: 'Machine Triceps Extension', eq: 'Trenajor',
    p: ['triceps'], s: [],
    cues: ['Dirsəklər yastıqda, oxla üst-üstə.', 'Qolları tam aç və sıx.', 'Yavaş qayıt.'],
    err: ['Çiyinləri qaldırmaq.'],
  },
  overhead_cable_ext: {
    az: 'Baş üstündən kabel triseps', en: 'Overhead Cable Triceps Extension', eq: 'Kabel (blok)',
    p: ['triceps'], s: [],
    cues: ['Kabeli orta və ya aşağı qur, arxanı kabelə çevir.', 'Dirsəklər qulaqların yanında, yalnız ön qol hərəkət etsin.', 'Uzun başlıqda dərin dartılma — triseps həcmi üçün ən güclü stimul.'],
    err: ['Dirsəkləri çox yana açmaq.'],
  },
  seated_db_overhead_ext: {
    az: 'Oturaq hantellə baş üstü triseps', en: 'Seated DB Overhead Extension', eq: 'Hantel + skamya',
    p: ['triceps'], s: [],
    cues: ['Arxalıqlı skamyada otur, hanteli iki əllə tut.', 'Hanteli başın arxasına endir, dirsəklər yuxarı baxsın.', 'Yuxarı it və sıx.'],
    err: ['Beli qövs etmək.'],
  },
  ez_skullcrusher: {
    az: 'EZ-ştanqla skull crusher (skamyada)', en: 'EZ-Bar Skull Crusher', eq: 'EZ-ştanq + skamya',
    p: ['triceps'], s: [],
    cues: ['Skamyada uzan (yerdə yox), ştanq sinənin üstündə.', 'Dirsəkləri sabit saxlayaraq ştanqı alnın arxasına endir.', 'Qolları açaraq qaldır.'],
    err: ['Dirsəkləri yanlara açmaq.'],
  },
  assisted_dip: {
    az: 'Köməkçi trenajorda dips', en: 'Assisted Dip Machine', eq: 'Trenajor',
    p: ['triceps', 'chest'], s: ['delts_front'],
    cues: ['Gövdəni azca önə əy — sinə daha çox işləyir.', 'Çiyinlər dirsək səviyyəsinə qədər en (ağrı olarsa daha dayaz).', 'Qolları tam aç, çiyinləri aşağı saxla.'],
    err: ['Çox dərin enib çiyini dartmaq.'],
  },
  machine_dip: {
    az: 'Oturaq dips trenajoru', en: 'Seated Dip Machine', eq: 'Trenajor',
    p: ['triceps'], s: ['chest', 'delts_front'],
    cues: ['Tutacaqlar gövdənin yanında.', 'Aşağı itələ, dirsəkləri arxaya yönəlt.', 'Yavaş qalx.'],
    err: ['Çiyinləri qulağa qaldırmaq.'],
  },
  close_grip_bench: {
    az: 'Dar tutuşla press (Smit / ştanq)', en: 'Close-Grip Bench Press', eq: 'Smit maşını + skamya',
    p: ['triceps'], s: ['chest', 'delts_front'],
    cues: ['Tutuş çiyin enində (çox dar deyil).', 'Dirsəklər gövdəyə yaxın endir.', 'Döşün alt hissəsinə endir, güclə qaldır.'],
    err: ['Həddindən dar tutuş — bilək ağrısı.'],
  },

  // ---------- QARIN / KOR ----------
  ab_crunch_machine: {
    az: 'Press trenajoru (crunch)', en: 'Ab Crunch Machine', eq: 'Trenajor',
    p: ['abs'], s: ['obliques'],
    cues: ['Ayaqları yastıqların altına keçir, tutacaqları tut.', 'Qollarla dartma — qabırğaları ombaya yaxınlaşdırırmış kimi bükül.', 'Aşağıda 1 saniyə sıx, havanı burax; yavaş qayıt.'],
    err: ['Ağır çəki ilə qolları dartmaq.'],
  },
  captains_chair: {
    az: 'Kapitan kreslosunda diz qaldırma', en: "Captain's Chair Knee Raise", eq: 'Trenajor',
    p: ['abs'], s: ['obliques'],
    cues: ['Dirsəklər yastıqda, kürək dayağa söykənsin.', 'Dizləri sinəyə doğru qaldır və ombanı azca önə yuvarlat.', 'Yellənmədən, nəzarətlə endir.'],
    err: ['Yalnız ayaqları qaldırıb ombanı bükməmək.'],
  },
  decline_crunch: {
    az: 'Mənfi meyilli skamyada crunch', en: 'Decline Bench Crunch', eq: 'Skamya',
    p: ['abs'], s: ['obliques'],
    cues: ['Ayaqları yastıqlara keçir, skamya yüngül meyildə.', 'Gövdənin yuxarı hissəsini bük, boynu əllə dartma.', 'Asanlaşanda sinəyə disk tut.'],
    err: ['Tam qalxıb bel ilə işləmək.'],
  },
  standing_cable_crunch: {
    az: 'Ayaq üstə kabel crunch', en: 'Standing Cable Crunch', eq: 'Kabel (blok)',
    p: ['abs'], s: ['obliques'],
    cues: ['Arxanı yuxarı bloka çevir, kəndiri çiyinlərin üstündə tut.', 'Ombanı sabit saxlayaraq qabırğaları aşağı bük.', 'Qollarla deyil, qarınla dart.'],
    err: ['Ombadan əyilərək hərəkəti dartışa çevirmək.'],
  },
  pallof_press: {
    az: 'Pallof press', en: 'Pallof Press', eq: 'Kabel (blok)',
    p: ['obliques', 'abs'], s: [],
    cues: ['Kabeli sinə hündürlüyündə qur, kabelə yan dayan.', 'Tutacağı sinədən irəli it və 2 saniyə saxla — gövdə dönməsin.', 'Hər tərəfə 10–12 təkrar.'],
    err: ['Kabelə tərəf fırlanmaq.'],
  },
  cable_woodchop: {
    az: 'Kabellə odun doğrama', en: 'Cable Woodchopper', eq: 'Kabel (blok)',
    p: ['obliques'], s: ['abs', 'delts_front'],
    cues: ['Kabel yuxarıda; iki əllə tut.', 'Çəpinə aşağı-qarşı ombaya doğru çək, gövdə ilə dön.', 'Ayaqlar möhkəm, nəzarətlə qayıt.'],
    err: ['Yalnız qollarla dartmaq.'],
  },
  rotary_torso: {
    az: 'Gövdə fırlatma trenajoru', en: 'Rotary Torso Machine', eq: 'Trenajor',
    p: ['obliques'], s: ['abs'],
    cues: ['Ayaqları bərkid, sinə yastıqda.', 'Kiçik çəki ilə yana fırlan.', 'Yavaş qayıt, hər tərəfə bərabər.'],
    err: ['Böyük çəki ilə sürətli fırlanmaq — belə yük.'],
  },
  incline_plank_bench: {
    az: 'Skamyada meyilli planka', en: 'Incline Plank on Bench', eq: 'Skamya',
    p: ['abs'], s: ['obliques', 'delts_front'],
    cues: ['Əllər və ya dirsəklər skamyada, ayaqlar arxada (yerdə uzanmırsan).', 'Bədən başdan dabana düz xətt, sağrı sıxılı.', '30–45 saniyə saxla.'],
    err: ['Ombanın aşağı düşməsi.'],
  },
};

// Məşq günləri. ex: [əsas, alt1, alt2, alt3]. pr: prioritet (sinə/qol) — faza 3 və 5-də +1 set.
export const DAYS = {
  A: {
    key: 'A', dow: 2, title: 'Məşq A', focus: 'Sinə · Bud önü · Kürək · Qollar',
    when: 'Çərşənbə axşamı, işdən sonra (18:30)',
    slots: [
      { ex: ['db_bench', 'machine_chest_press', 'smith_bench', 'bb_bench'], reps: '8–10', rest: 120, pr: true },
      { ex: ['leg_press', 'hack_squat', 'smith_squat', 'goblet_squat'], reps: '10–12', rest: 120 },
      { ex: ['seated_cable_row', 'chest_supported_row', 'db_row_bench', 'tbar_row'], reps: '10–12', rest: 90 },
      { ex: ['pec_deck', 'cable_crossover', 'incline_db_fly', 'low_high_cable_fly'], reps: '12–15', rest: 75, pr: true },
      { ex: ['db_shoulder_press', 'machine_shoulder_press', 'smith_shoulder_press', 'landmine_press'], reps: '8–12', rest: 90 },
      { ex: ['ez_curl', 'db_curl', 'cable_curl', 'preacher_curl'], reps: '10–12', rest: 75, pr: true, ss: 'Qollar: biseps və triseps superset edilə bilər.' },
      { ex: ['rope_pushdown', 'bar_pushdown', 'machine_triceps_ext', 'overhead_cable_ext'], reps: '10–12', rest: 75, pr: true },
      { ex: ['ab_crunch_machine', 'captains_chair', 'decline_crunch', 'standing_cable_crunch'], reps: '12–15', rest: 60 },
    ],
  },
  B: {
    key: 'B', dow: 4, title: 'Məşq B', focus: 'Kürək · Bud arxası · Üst sinə · Qollar',
    when: 'Cümə axşamı, işdən sonra (18:30)',
    slots: [
      { ex: ['lat_pulldown', 'assisted_pullup', 'machine_pulldown', 'single_arm_pulldown'], reps: '8–12', rest: 120 },
      { ex: ['db_rdl', 'bb_rdl', 'smith_rdl', 'back_extension_45'], reps: '8–10', rest: 120 },
      { ex: ['incline_db_press', 'incline_machine_press', 'incline_smith_press', 'incline_bb_press'], reps: '8–10', rest: 120, pr: true },
      { ex: ['seated_leg_curl', 'lying_leg_curl', 'standing_leg_curl', 'back_extension_45'], reps: '10–12', rest: 90 },
      { ex: ['cable_lateral', 'db_lateral', 'machine_lateral', 'cable_y_raise'], reps: '12–15', rest: 60 },
      { ex: ['incline_db_curl', 'bayesian_curl', 'preacher_curl', 'db_curl'], reps: '10–12', rest: 75, pr: true },
      { ex: ['overhead_cable_ext', 'seated_db_overhead_ext', 'ez_skullcrusher', 'rope_pushdown'], reps: '10–12', rest: 75, pr: true },
      { ex: ['pallof_press', 'cable_woodchop', 'rotary_torso', 'incline_plank_bench'], reps: '10–12 / tərəf', rest: 60 },
    ],
  },
  C: {
    key: 'C', dow: 6, title: 'Məşq C', focus: 'Sinə (ağır) · Ayaq · Kürək · Qollar',
    when: 'Şənbə, evdə olduğun gün (11:00 tövsiyə)',
    slots: [
      { ex: ['bb_bench', 'smith_bench', 'machine_chest_press', 'db_bench'], reps: '6–8', rest: 150, pr: true },
      { ex: ['hack_squat', 'leg_press', 'smith_squat', 'goblet_squat'], reps: '8–10', rest: 120 },
      { ex: ['chest_supported_row', 'tbar_row', 'seated_cable_row', 'db_row_bench'], reps: '8–12', rest: 90 },
      { ex: ['low_high_cable_fly', 'cable_crossover', 'pec_deck', 'incline_db_fly'], reps: '12–15', rest: 75, pr: true },
      { ex: ['leg_extension', 'bulgarian_split_squat', 'db_walking_lunge', 'smith_split_squat'], reps: '12–15', rest: 90 },
      { ex: ['assisted_dip', 'machine_dip', 'close_grip_bench', 'bar_pushdown'], reps: '8–12', rest: 90, pr: true },
      { ex: ['hammer_curl', 'rope_hammer_curl', 'db_curl', 'preacher_curl'], reps: '10–12', rest: 60, pr: true },
      { ex: ['captains_chair', 'ab_crunch_machine', 'decline_crunch', 'standing_cable_crunch'], reps: '10–15', rest: 60 },
    ],
  },
};

export const WARMUP = [
  { ex: ['treadmill_incline', 'stationary_bike', 'elliptical', 'rower'], dose: '5–8 dəq', label: 'Ümumi isinmə' },
  { ex: ['face_pull', 'band_pull_apart', 'band_dislocate', 'reverse_pec_deck'], dose: '2 × 15', label: 'Çiyin hazırlığı' },
  { ex: ['box_squat_bench', 'leg_swings', 'bw_lunge', 'hip_hinge_dowel'], dose: '2 × 10', label: 'Ayaq və omba hazırlığı' },
];

export const COOLDOWN = [
  'Qapı çərçivəsində sinə dartması — 2 × 30 san',
  'Ayaq üstə bud önü dartması (dayaqdan tutaraq) — hər ayağa 30 san',
  'Bud arxası dartması: daban skamyada, gövdə önə — hər ayağa 30 san',
  'Lat dartması: dayaqdan tutub kalçanı geri ver — 2 × 30 san',
];

// 52 həftəlik fazalar
export const PHASES = [
  {
    n: 1, name: 'Təməl', from: 1, to: 4, rir: '3–4', color: 'cobalt',
    goal: 'Texnikanı öyrən, oynaqları və vərdişi qur.',
    points: ['Hər hərəkətdə 2 işçi set', 'Çəkini texnika pozulmayana qədər artır', 'Gündə 7 000 addım', 'Kalori defisiti başlayır'],
  },
  {
    n: 2, name: 'Güc və yağ yandırma', from: 5, to: 16, rir: '2–3',
    goal: 'Hər həftə ya təkrar, ya çəki artsın.',
    points: ['3 işçi set', 'Məşqdən sonra 10–15 dəq meyilli yeriş', 'Gündə 8 000–9 000 addım', 'Həftədə 1 dəfə üzgüçülük', '13-cü həftə: 1 həftəlik kalori fasiləsi (saxlama kalorisi)'],
  },
  {
    n: 3, name: 'Sinə və qol prioriteti', from: 17, to: 32, rir: '1–2',
    goal: 'Sinə və qollara əlavə həcm; bel ölçüsü azalmağa davam edir.',
    points: ['Sinə və qol hərəkətlərində 4 set', 'Gündə 10 000 addım', 'Həftədə 2 dəfə üzgüçülük', '27-ci həftə: kalori fasiləsi'],
  },
  {
    n: 4, name: 'Definisiya', from: 33, to: 44, rir: '1–2',
    goal: 'Qarın piyinin son qatı: press görünməyə başlayır.',
    points: ['3 set, çəkini saxla — güc itməsin', 'Addım və üzgüçülüyü saxla', 'Proteini aşağı salma', 'Hər 2 həftə plato olarsa −100 kcal'],
  },
  {
    n: 5, name: 'Prime: saxlama və təmiz kütlə', from: 45, to: 52, rir: '1–2',
    goal: 'Saxlama kalorisi +150; formanı qoru və əzələ yığmağa keç.',
    points: ['Prioritet hərəkətlərdə 4 set', 'Kalori saxlama səviyyəsinə qalxır', 'Yeni 12 aylıq plan: təmiz kütlə yığımı'],
  },
];

export const DELOAD_WEEKS = [8, 16, 24, 32, 40, 48];
export const DIET_BREAK_WEEKS = [13, 27];

export function phaseForWeek(w) {
  return PHASES.find((p) => w >= p.from && w <= p.to) || (w < 1 ? PHASES[0] : PHASES[PHASES.length - 1]);
}

export function setsFor(slot, phaseN, deload) {
  const base = { 1: 2, 2: 3, 3: slot.pr ? 4 : 3, 4: 3, 5: slot.pr ? 4 : 3 }[phaseN] || 3;
  return deload ? Math.max(1, Math.ceil(base / 2)) : base;
}

export function restLabel(sec) {
  if (sec >= 120) return `${(sec / 60).toString().replace('.', ',')} dəq`;
  return `${sec} san`;
}

// Hədəf çəki trayektoriyası (həftə → kq). Fərdi fərqlər olacaq; bu, orta proqnozdur.
export const TARGET_WAYPOINTS = [
  [0, 95], [2, 93.6], [4, 92.4], [8, 90.8], [12, 89.4], [16, 88.2], [24, 86], [32, 84], [40, 82.3], [44, 81.6], [52, 82],
];

export function targetWeightAt(week) {
  const w = TARGET_WAYPOINTS;
  if (week <= w[0][0]) return w[0][1];
  for (let i = 1; i < w.length; i++) {
    if (week <= w[i][0]) {
      const [x0, y0] = w[i - 1]; const [x1, y1] = w[i];
      return y0 + ((week - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return w[w.length - 1][1];
}

export const MILESTONES = [
  { week: 4, title: '1-ci ay', kg: '≈ 92', text: 'Texnika oturur, güc 20–30% artır. Bel ölçüsü 2–3 sm azalır.' },
  { week: 12, title: '3-cü ay', kg: '≈ 89–90', text: 'Bel −5–7 sm. Paltar fərqli oturur, sinə və çiyin forması seçilir.' },
  { week: 24, title: '6-cı ay', kg: '≈ 86', text: 'Bel −9–11 sm. Güclü işıqda üst pressin konturu görünür.' },
  { week: 36, title: '9-cu ay', kg: '≈ 83', text: 'Üst press (4 kub) görünür, qollar sıx və formalı.' },
  { week: 52, title: '12-ci ay', kg: '≈ 81–82', text: 'Təxminən 13–15% bədən yağı. "Prime" baza hazırdır; növbəti mərhələ təmiz kütlə.' },
];
