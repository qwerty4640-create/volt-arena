import fs from 'fs';

const en = {
  'stage.arnold': 'Arnold Classic', 'stage.uspl': 'USPL Nationals', 'stage.desert': 'The Dust Bowl', 'stage.space': 'Lunar Station 4',
  'stage.squat': 'Squat', 'stage.benchPress': 'Bench Press', 'stage.deadlift': 'Deadlift',
  'stage.beltTension': 'Belt Tension Verified', 'stage.kneeSleeves': 'Knee Sleeves Secured', 'stage.wristWraps': 'Wrist Wraps Locked', 'stage.chalkApplied': 'Chalk Applied', 'stage.mentalFocus': 'Mental Focus Calibrated', 'stage.safetySpotters': 'Safety Spotters Ready',
  'stage.competitionSetup': 'Competition Setup', 'stage.selectEnvironment': 'Select Environment', 'stage.chooseBattleground': 'Choose your battleground. Physics and lighting will adapt accordingly.', 'stage.selected': 'Selected', 'stage.select': 'Select',
  'stage.nextProtocol': 'Next: Protocol', 'stage.protocolConfig': 'Protocol Configuration', 'stage.setTargetLoads': 'Set your target loads for the upcoming session.', 'stage.backEnvironment': 'Back to Environment',
  'stage.nextPreFlight': 'Next: Pre-Flight', 'stage.preFlightChecklist': 'Pre-Flight Checklist', 'stage.verifySystems': 'Verify all systems before initiating the sequence.', 'stage.backProtocol': 'Back to Protocol',
  'stage.initiateSequence': 'Initiate Sequence', 'stage.termsOfEngagement': 'Terms of Engagement', 'stage.termsMessage': 'By proceeding, you acknowledge the physical risks associated with maximal load lifting. Vanguard assumes no liability for CNS fatigue, musculoskeletal damage, or ego bruising.', 'stage.iAccept': 'I Accept the Risks', 'stage.cancel': 'Cancel',
  'stage.withdrawTitle': 'Withdraw from Competition?', 'stage.withdrawMessage': 'Are you sure you want to abort the sequence? Your current setup will be lost.', 'stage.withdraw': 'Withdraw', 'stage.stay': 'Stay',
  'stage.ready': 'READY', 'stage.targetLoad': 'Target Load', 'stage.heartRate': 'Heart Rate', 'stage.bpm': 'BPM', 'stage.vo2Max': 'VO2 Max', 'stage.peak': 'Peak',
  'stage.bodyTemp': 'Body Temp', 'stage.cnsStatus': 'CNS Status', 'stage.optimal': 'Optimal', 'stage.stabilityLock': 'Stability Lock', 'stage.engaged': 'Engaged', 'stage.abortSequence': 'Abort Sequence',
  'hud.berserkerState': 'Berserker_State', 'hud.active': 'Active', 'hud.heartRate': 'Heart_Rate', 'hud.bpm': 'BPM', 'hud.kineticSurge': 'Kinetic_Surge', 'hud.completeLift': 'Complete Lift', 'hud.maxCapacity': 'Maximum Capacity Reached',
  'hud.peakPower': 'Peak_Power', 'hud.w': 'W', 'hud.stabilityIndex': 'Stability_Index', 'hud.critical': 'Critical',
  'safety.dangerDetected': 'DANGER DETECTED', 'safety.formBreakdown': 'Form breakdown imminent. Velocity drop exceeds safety threshold.', 'safety.yesOk': 'Yes - I am OK', 'safety.cancelAlert': 'Cancel Alert', 'safety.abortLift': 'Abort Lift', 'safety.deploySpotters': 'Deploy Spotters',
  'analytics.title': 'Performance Analytics', 'analytics.subtitle': 'Deep dive into your training data and progression metrics.', 'analytics.volumeProgression': 'Volume Progression', 'analytics.intensityDistribution': 'Intensity Distribution', 'analytics.recoveryTrends': 'Recovery Trends',
  'analytics.muscleActivation': 'Muscle Activation', 'analytics.1rmProjections': '1RM Projections', 'analytics.velocityProfile': 'Velocity Profile', 'analytics.exportData': 'Export Data', 'analytics.generateReport': 'Generate Report',
  'analytics.timeframe': 'Timeframe', 'analytics.1m': '1M', 'analytics.3m': '3M', 'analytics.6m': '6M', 'analytics.1y': '1Y', 'analytics.all': 'ALL',
  'analytics.squat': 'Squat', 'analytics.bench': 'Bench', 'analytics.deadlift': 'Deadlift', 'analytics.total': 'Total',
  'analytics.volume': 'Volume', 'analytics.intensity': 'Intensity (%)', 'analytics.recoveryScore': 'Recovery Score', 'analytics.activation': 'Activation (%)', 'analytics.projected1rm': 'Projected 1RM', 'analytics.velocity': 'Velocity (m/s)'
};

const zh = {
  'stage.arnold': '阿诺德经典赛', 'stage.uspl': 'USPL全国赛', 'stage.desert': '沙尘暴', 'stage.space': '月球空间站4号',
  'stage.squat': '深蹲', 'stage.benchPress': '卧推', 'stage.deadlift': '硬拉',
  'stage.beltTension': '腰带张力已确认', 'stage.kneeSleeves': '护膝已固定', 'stage.wristWraps': '护腕已锁定', 'stage.chalkApplied': '已涂抹镁粉', 'stage.mentalFocus': '精神专注已校准', 'stage.safetySpotters': '安全保护员已就绪',
  'stage.competitionSetup': '比赛设置', 'stage.selectEnvironment': '选择环境', 'stage.chooseBattleground': '选择你的战场。物理和光照将相应调整。', 'stage.selected': '已选择', 'stage.select': '选择',
  'stage.nextProtocol': '下一步：协议', 'stage.protocolConfig': '协议配置', 'stage.setTargetLoads': '设置即将到来的训练目标负荷。', 'stage.backEnvironment': '返回环境',
  'stage.nextPreFlight': '下一步：起飞前检查', 'stage.preFlightChecklist': '起飞前检查清单', 'stage.verifySystems': '在启动序列之前验证所有系统。', 'stage.backProtocol': '返回协议',
  'stage.initiateSequence': '启动序列', 'stage.termsOfEngagement': '交战条款', 'stage.termsMessage': '继续操作即表示您承认与最大负荷举重相关的物理风险。Vanguard对中枢神经系统疲劳、肌肉骨骼损伤或自尊心受挫不承担任何责任。', 'stage.iAccept': '我接受风险', 'stage.cancel': '取消',
  'stage.withdrawTitle': '退出比赛？', 'stage.withdrawMessage': '您确定要中止序列吗？您当前的设置将丢失。', 'stage.withdraw': '退出', 'stage.stay': '留下',
  'stage.ready': '准备就绪', 'stage.targetLoad': '目标负荷', 'stage.heartRate': '心率', 'stage.bpm': '次/分', 'stage.vo2Max': '最大摄氧量', 'stage.peak': '峰值',
  'stage.bodyTemp': '体温', 'stage.cnsStatus': '中枢神经系统状态', 'stage.optimal': '最佳', 'stage.stabilityLock': '稳定性锁定', 'stage.engaged': '已启动', 'stage.abortSequence': '中止序列',
  'hud.berserkerState': '狂暴状态', 'hud.active': '活跃', 'hud.heartRate': '心率', 'hud.bpm': '次/分', 'hud.kineticSurge': '动能激增', 'hud.completeLift': '完成举重', 'hud.maxCapacity': '已达到最大容量',
  'hud.peakPower': '峰值功率', 'hud.w': '瓦特', 'hud.stabilityIndex': '稳定性指数', 'hud.critical': '危急',
  'safety.dangerDetected': '检测到危险', 'safety.formBreakdown': '动作即将崩溃。速度下降超过安全阈值。', 'safety.yesOk': '是的 - 我没事', 'safety.cancelAlert': '取消警报', 'safety.abortLift': '中止举重', 'safety.deploySpotters': '部署保护员',
  'analytics.title': '表现分析', 'analytics.subtitle': '深入了解您的训练数据和进度指标。', 'analytics.volumeProgression': '容量进度', 'analytics.intensityDistribution': '强度分布', 'analytics.recoveryTrends': '恢复趋势',
  'analytics.muscleActivation': '肌肉激活', 'analytics.1rmProjections': '1RM预测', 'analytics.velocityProfile': '速度分布', 'analytics.exportData': '导出数据', 'analytics.generateReport': '生成报告',
  'analytics.timeframe': '时间范围', 'analytics.1m': '1个月', 'analytics.3m': '3个月', 'analytics.6m': '6个月', 'analytics.1y': '1年', 'analytics.all': '全部',
  'analytics.squat': '深蹲', 'analytics.bench': '卧推', 'analytics.deadlift': '硬拉', 'analytics.total': '总计',
  'analytics.volume': '容量', 'analytics.intensity': '强度 (%)', 'analytics.recoveryScore': '恢复分数', 'analytics.activation': '激活 (%)', 'analytics.projected1rm': '预测1RM', 'analytics.velocity': '速度 (m/s)'
};

const ko = {
  'stage.arnold': '아놀드 클래식', 'stage.uspl': 'USPL 내셔널스', 'stage.desert': '더스트 볼', 'stage.space': '루나 스테이션 4',
  'stage.squat': '스쿼트', 'stage.benchPress': '벤치 프레스', 'stage.deadlift': '데드리프트',
  'stage.beltTension': '벨트 장력 확인됨', 'stage.kneeSleeves': '무릎 슬리브 고정됨', 'stage.wristWraps': '손목 랩 잠김', 'stage.chalkApplied': '초크 적용됨', 'stage.mentalFocus': '정신 집중 보정됨', 'stage.safetySpotters': '안전 스포터 준비됨',
  'stage.competitionSetup': '대회 설정', 'stage.selectEnvironment': '환경 선택', 'stage.chooseBattleground': '전장을 선택하세요. 물리 및 조명이 그에 맞게 조정됩니다.', 'stage.selected': '선택됨', 'stage.select': '선택',
  'stage.nextProtocol': '다음: 프로토콜', 'stage.protocolConfig': '프로토콜 구성', 'stage.setTargetLoads': '다가오는 세션의 목표 하중을 설정하세요.', 'stage.backEnvironment': '환경으로 돌아가기',
  'stage.nextPreFlight': '다음: 비행 전', 'stage.preFlightChecklist': '비행 전 체크리스트', 'stage.verifySystems': '시퀀스를 시작하기 전에 모든 시스템을 확인하세요.', 'stage.backProtocol': '프로토콜로 돌아가기',
  'stage.initiateSequence': '시퀀스 시작', 'stage.termsOfEngagement': '참여 조건', 'stage.termsMessage': '계속 진행하면 최대 하중 리프팅과 관련된 신체적 위험을 인정하는 것입니다. Vanguard는 CNS 피로, 근골격계 손상 또는 자존심 상처에 대해 책임을 지지 않습니다.', 'stage.iAccept': '위험을 수락합니다', 'stage.cancel': '취소',
  'stage.withdrawTitle': '대회에서 기권하시겠습니까?', 'stage.withdrawMessage': '시퀀스를 중단하시겠습니까? 현재 설정이 손실됩니다.', 'stage.withdraw': '기권', 'stage.stay': '머무르기',
  'stage.ready': '준비 완료', 'stage.targetLoad': '목표 하중', 'stage.heartRate': '심박수', 'stage.bpm': 'BPM', 'stage.vo2Max': 'VO2 Max', 'stage.peak': '최고',
  'stage.bodyTemp': '체온', 'stage.cnsStatus': 'CNS 상태', 'stage.optimal': '최적', 'stage.stabilityLock': '안정성 잠금', 'stage.engaged': '작동됨', 'stage.abortSequence': '시퀀스 중단',
  'hud.berserkerState': '광전사 상태', 'hud.active': '활성', 'hud.heartRate': '심박수', 'hud.bpm': 'BPM', 'hud.kineticSurge': '운동 에너지 급증', 'hud.completeLift': '리프트 완료', 'hud.maxCapacity': '최대 용량 도달',
  'hud.peakPower': '최고 출력', 'hud.w': 'W', 'hud.stabilityIndex': '안정성 지수', 'hud.critical': '위험',
  'safety.dangerDetected': '위험 감지됨', 'safety.formBreakdown': '자세 붕괴 임박. 속도 저하가 안전 임계값을 초과했습니다.', 'safety.yesOk': '네 - 괜찮습니다', 'safety.cancelAlert': '경보 취소', 'safety.abortLift': '리프트 중단', 'safety.deploySpotters': '스포터 배치',
  'analytics.title': '성과 분석', 'analytics.subtitle': '훈련 데이터 및 진행 지표를 심층 분석합니다.', 'analytics.volumeProgression': '볼륨 진행', 'analytics.intensityDistribution': '강도 분포', 'analytics.recoveryTrends': '회복 추세',
  'analytics.muscleActivation': '근육 활성화', 'analytics.1rmProjections': '1RM 예측', 'analytics.velocityProfile': '속도 프로필', 'analytics.exportData': '데이터 내보내기', 'analytics.generateReport': '보고서 생성',
  'analytics.timeframe': '기간', 'analytics.1m': '1개월', 'analytics.3m': '3개월', 'analytics.6m': '6개월', 'analytics.1y': '1년', 'analytics.all': '전체',
  'analytics.squat': '스쿼트', 'analytics.bench': '벤치', 'analytics.deadlift': '데드리프트', 'analytics.total': '총계',
  'analytics.volume': '볼륨', 'analytics.intensity': '강도 (%)', 'analytics.recoveryScore': '회복 점수', 'analytics.activation': '활성화 (%)', 'analytics.projected1rm': '예상 1RM', 'analytics.velocity': '속도 (m/s)'
};

const ja = {
  'stage.arnold': 'アーノルド・クラシック', 'stage.uspl': 'USPLナショナルズ', 'stage.desert': 'ダストボウル', 'stage.space': 'ルナステーション4',
  'stage.squat': 'スクワット', 'stage.benchPress': 'ベンチプレス', 'stage.deadlift': 'デッドリフト',
  'stage.beltTension': 'ベルトの張力確認済み', 'stage.kneeSleeves': 'ニースリーブ固定済み', 'stage.wristWraps': 'リストラップロック済み', 'stage.chalkApplied': 'チョーク適用済み', 'stage.mentalFocus': '精神集中調整済み', 'stage.safetySpotters': '安全スポッター準備完了',
  'stage.competitionSetup': '大会設定', 'stage.selectEnvironment': '環境の選択', 'stage.chooseBattleground': '戦場を選択してください。物理と照明がそれに応じて適応します。', 'stage.selected': '選択済み', 'stage.select': '選択',
  'stage.nextProtocol': '次へ：プロトコル', 'stage.protocolConfig': 'プロトコル構成', 'stage.setTargetLoads': '今後のセッションの目標負荷を設定します。', 'stage.backEnvironment': '環境に戻る',
  'stage.nextPreFlight': '次へ：飛行前', 'stage.preFlightChecklist': '飛行前チェックリスト', 'stage.verifySystems': 'シーケンスを開始する前にすべてのシステムを確認してください。', 'stage.backProtocol': 'プロトコルに戻る',
  'stage.initiateSequence': 'シーケンス開始', 'stage.termsOfEngagement': '参加条件', 'stage.termsMessage': '続行することにより、最大負荷の持ち上げに関連する身体的リスクを認識したことになります。Vanguardは、CNSの疲労、筋骨格の損傷、または自尊心の傷について一切の責任を負いません。', 'stage.iAccept': 'リスクを受け入れます', 'stage.cancel': 'キャンセル',
  'stage.withdrawTitle': '大会から棄権しますか？', 'stage.withdrawMessage': 'シーケンスを中止してもよろしいですか？現在の設定は失われます。', 'stage.withdraw': '棄権', 'stage.stay': '留まる',
  'stage.ready': '準備完了', 'stage.targetLoad': '目標負荷', 'stage.heartRate': '心拍数', 'stage.bpm': 'BPM', 'stage.vo2Max': 'VO2 Max', 'stage.peak': 'ピーク',
  'stage.bodyTemp': '体温', 'stage.cnsStatus': 'CNSステータス', 'stage.optimal': '最適', 'stage.stabilityLock': '安定性ロック', 'stage.engaged': '作動中', 'stage.abortSequence': 'シーケンス中止',
  'hud.berserkerState': 'バーサーカー状態', 'hud.active': 'アクティブ', 'hud.heartRate': '心拍数', 'hud.bpm': 'BPM', 'hud.kineticSurge': 'キネティックサージ', 'hud.completeLift': 'リフト完了', 'hud.maxCapacity': '最大容量に達しました',
  'hud.peakPower': 'ピーク電力', 'hud.w': 'W', 'hud.stabilityIndex': '安定性指数', 'hud.critical': 'クリティカル',
  'safety.dangerDetected': '危険を検知', 'safety.formBreakdown': 'フォームの崩れが差し迫っています。速度低下が安全閾値を超えました。', 'safety.yesOk': 'はい - 大丈夫です', 'safety.cancelAlert': 'アラートをキャンセル', 'safety.abortLift': 'リフトを中止', 'safety.deploySpotters': 'スポッターを配置',
  'analytics.title': 'パフォーマンス分析', 'analytics.subtitle': 'トレーニングデータと進行状況の指標を深く掘り下げます。', 'analytics.volumeProgression': 'ボリュームの進行', 'analytics.intensityDistribution': '強度の分布', 'analytics.recoveryTrends': '回復の傾向',
  'analytics.muscleActivation': '筋肉の活性化', 'analytics.1rmProjections': '1RM予測', 'analytics.velocityProfile': '速度プロファイル', 'analytics.exportData': 'データのエクスポート', 'analytics.generateReport': 'レポートの生成',
  'analytics.timeframe': '期間', 'analytics.1m': '1ヶ月', 'analytics.3m': '3ヶ月', 'analytics.6m': '6ヶ月', 'analytics.1y': '1年', 'analytics.all': 'すべて',
  'analytics.squat': 'スクワット', 'analytics.bench': 'ベンチ', 'analytics.deadlift': 'デッドリフト', 'analytics.total': '合計',
  'analytics.volume': 'ボリューム', 'analytics.intensity': '強度 (%)', 'analytics.recoveryScore': '回復スコア', 'analytics.activation': '活性化 (%)', 'analytics.projected1rm': '予測1RM', 'analytics.velocity': '速度 (m/s)'
};

const es = {
  'stage.arnold': 'Arnold Classic', 'stage.uspl': 'Nacionales USPL', 'stage.desert': 'El Tazón de Polvo', 'stage.space': 'Estación Lunar 4',
  'stage.squat': 'Sentadilla', 'stage.benchPress': 'Press de Banca', 'stage.deadlift': 'Peso Muerto',
  'stage.beltTension': 'Tensión del Cinturón Verificada', 'stage.kneeSleeves': 'Rodilleras Aseguradas', 'stage.wristWraps': 'Muñequeras Bloqueadas', 'stage.chalkApplied': 'Tiza Aplicada', 'stage.mentalFocus': 'Enfoque Mental Calibrado', 'stage.safetySpotters': 'Observadores de Seguridad Listos',
  'stage.competitionSetup': 'Configuración de la Competición', 'stage.selectEnvironment': 'Seleccionar Entorno', 'stage.chooseBattleground': 'Elige tu campo de batalla. La física y la iluminación se adaptarán en consecuencia.', 'stage.selected': 'Seleccionado', 'stage.select': 'Seleccionar',
  'stage.nextProtocol': 'Siguiente: Protocolo', 'stage.protocolConfig': 'Configuración del Protocolo', 'stage.setTargetLoads': 'Establece tus cargas objetivo para la próxima sesión.', 'stage.backEnvironment': 'Volver al Entorno',
  'stage.nextPreFlight': 'Siguiente: Pre-Vuelo', 'stage.preFlightChecklist': 'Lista de Verificación Pre-Vuelo', 'stage.verifySystems': 'Verifica todos los sistemas antes de iniciar la secuencia.', 'stage.backProtocol': 'Volver al Protocolo',
  'stage.initiateSequence': 'Iniciar Secuencia', 'stage.termsOfEngagement': 'Términos de Compromiso', 'stage.termsMessage': 'Al proceder, reconoces los riesgos físicos asociados con el levantamiento de carga máxima. Vanguard no asume ninguna responsabilidad por fatiga del SNC, daño musculoesquelético o moretones en el ego.', 'stage.iAccept': 'Acepto los Riesgos', 'stage.cancel': 'Cancelar',
  'stage.withdrawTitle': '¿Retirarse de la Competición?', 'stage.withdrawMessage': '¿Estás seguro de que quieres abortar la secuencia? Tu configuración actual se perderá.', 'stage.withdraw': 'Retirarse', 'stage.stay': 'Quedarse',
  'stage.ready': 'LISTO', 'stage.targetLoad': 'Carga Objetivo', 'stage.heartRate': 'Frecuencia Cardíaca', 'stage.bpm': 'LPM', 'stage.vo2Max': 'VO2 Máx', 'stage.peak': 'Pico',
  'stage.bodyTemp': 'Temp. Corporal', 'stage.cnsStatus': 'Estado del SNC', 'stage.optimal': 'Óptimo', 'stage.stabilityLock': 'Bloqueo de Estabilidad', 'stage.engaged': 'Enganchado', 'stage.abortSequence': 'Abortar Secuencia',
  'hud.berserkerState': 'Estado_Berserker', 'hud.active': 'Activo', 'hud.heartRate': 'Frecuencia_Cardíaca', 'hud.bpm': 'LPM', 'hud.kineticSurge': 'Oleada_Cinética', 'hud.completeLift': 'Completar Levantamiento', 'hud.maxCapacity': 'Capacidad Máxima Alcanzada',
  'hud.peakPower': 'Potencia_Pico', 'hud.w': 'W', 'hud.stabilityIndex': 'Índice_de_Estabilidad', 'hud.critical': 'Crítico',
  'safety.dangerDetected': 'PELIGRO DETECTADO', 'safety.formBreakdown': 'Desglose de forma inminente. La caída de velocidad supera el umbral de seguridad.', 'safety.yesOk': 'Sí - Estoy Bien', 'safety.cancelAlert': 'Cancelar Alerta', 'safety.abortLift': 'Abortar Levantamiento', 'safety.deploySpotters': 'Desplegar Observadores',
  'analytics.title': 'Análisis de Rendimiento', 'analytics.subtitle': 'Sumérgete en tus datos de entrenamiento y métricas de progresión.', 'analytics.volumeProgression': 'Progresión de Volumen', 'analytics.intensityDistribution': 'Distribución de Intensidad', 'analytics.recoveryTrends': 'Tendencias de Recuperación',
  'analytics.muscleActivation': 'Activación Muscular', 'analytics.1rmProjections': 'Proyecciones 1RM', 'analytics.velocityProfile': 'Perfil de Velocidad', 'analytics.exportData': 'Exportar Datos', 'analytics.generateReport': 'Generar Informe',
  'analytics.timeframe': 'Plazo', 'analytics.1m': '1M', 'analytics.3m': '3M', 'analytics.6m': '6M', 'analytics.1y': '1A', 'analytics.all': 'TODO',
  'analytics.squat': 'Sentadilla', 'analytics.bench': 'Banca', 'analytics.deadlift': 'Peso Muerto', 'analytics.total': 'Total',
  'analytics.volume': 'Volumen', 'analytics.intensity': 'Intensidad (%)', 'analytics.recoveryScore': 'Puntuación de Recuperación', 'analytics.activation': 'Activación (%)', 'analytics.projected1rm': '1RM Proyectado', 'analytics.velocity': 'Velocidad (m/s)'
};

const hi = {
  'stage.arnold': 'अर्नोल्ड क्लासिक', 'stage.uspl': 'यूएसपीएल नेशनल्स', 'stage.desert': 'द डस्ट बाउल', 'stage.space': 'लूनर स्टेशन 4',
  'stage.squat': 'स्क्वाट', 'stage.benchPress': 'बेंच प्रेस', 'stage.deadlift': 'डेडलिफ्ट',
  'stage.beltTension': 'बेल्ट तनाव सत्यापित', 'stage.kneeSleeves': 'घुटने की आस्तीन सुरक्षित', 'stage.wristWraps': 'कलाई लपेटें बंद', 'stage.chalkApplied': 'चाक लागू', 'stage.mentalFocus': 'मानसिक फोकस कैलिब्रेटेड', 'stage.safetySpotters': 'सुरक्षा स्पॉटर तैयार',
  'stage.competitionSetup': 'प्रतियोगिता सेटअप', 'stage.selectEnvironment': 'पर्यावरण का चयन करें', 'stage.chooseBattleground': 'अपना युद्धक्षेत्र चुनें। भौतिकी और प्रकाश व्यवस्था तदनुसार अनुकूलित होगी।', 'stage.selected': 'चयनित', 'stage.select': 'चयन करें',
  'stage.nextProtocol': 'अगला: प्रोटोकॉल', 'stage.protocolConfig': 'प्रोटोकॉल कॉन्फ़िगरेशन', 'stage.setTargetLoads': 'आगामी सत्र के लिए अपना लक्ष्य भार निर्धारित करें।', 'stage.backEnvironment': 'पर्यावरण पर वापस जाएं',
  'stage.nextPreFlight': 'अगला: प्री-फ्लाइट', 'stage.preFlightChecklist': 'प्री-फ्लाइट चेकलिस्ट', 'stage.verifySystems': 'अनुक्रम शुरू करने से पहले सभी प्रणालियों को सत्यापित करें।', 'stage.backProtocol': 'प्रोटोकॉल पर वापस जाएं',
  'stage.initiateSequence': 'अनुक्रम आरंभ करें', 'stage.termsOfEngagement': 'सगाई की शर्तें', 'stage.termsMessage': 'आगे बढ़कर, आप अधिकतम भार उठाने से जुड़े शारीरिक जोखिमों को स्वीकार करते हैं। वोल्ट एरिना सीएनएस थकान, मस्कुलोस्केलेटल क्षति, या अहंकार को चोट पहुंचाने के लिए कोई दायित्व नहीं लेता है।', 'stage.iAccept': 'मैं जोखिम स्वीकार करता हूं', 'stage.cancel': 'रद्द करें',
  'stage.withdrawTitle': 'प्रतियोगिता से वापस लें?', 'stage.withdrawMessage': 'क्या आप वाकई अनुक्रम को निरस्त करना चाहते हैं? आपका वर्तमान सेटअप खो जाएगा।', 'stage.withdraw': 'वापस लें', 'stage.stay': 'रुकें',
  'stage.ready': 'तैयार', 'stage.targetLoad': 'लक्ष्य भार', 'stage.heartRate': 'हृदय गति', 'stage.bpm': 'बीपीएम', 'stage.vo2Max': 'वीओ2 मैक्स', 'stage.peak': 'शिखर',
  'stage.bodyTemp': 'शरीर का तापमान', 'stage.cnsStatus': 'सीएनएस स्थिति', 'stage.optimal': 'इष्टतम', 'stage.stabilityLock': 'स्थिरता लॉक', 'stage.engaged': 'लगा हुआ', 'stage.abortSequence': 'अनुक्रम निरस्त करें',
  'hud.berserkerState': 'बर्सर्कर_स्थिति', 'hud.active': 'सक्रिय', 'hud.heartRate': 'हृदय_गति', 'hud.bpm': 'बीपीएम', 'hud.kineticSurge': 'गतिज_वृद्धि', 'hud.completeLift': 'लिफ्ट पूरी करें', 'hud.maxCapacity': 'अधिकतम क्षमता तक पहुंच गया',
  'hud.peakPower': 'शिखर_शक्ति', 'hud.w': 'डब्ल्यू', 'hud.stabilityIndex': 'स्थिरता_सूचकांक', 'hud.critical': 'महत्वपूर्ण',
  'safety.dangerDetected': 'खतरा पाया गया', 'safety.formBreakdown': 'फॉर्म टूटना आसन्न है। वेग में गिरावट सुरक्षा सीमा से अधिक है।', 'safety.yesOk': 'हां - मैं ठीक हूं', 'safety.cancelAlert': 'अलर्ट रद्द करें', 'safety.abortLift': 'लिफ्ट निरस्त करें', 'safety.deploySpotters': 'स्पॉटर तैनात करें',
  'analytics.title': 'प्रदर्शन विश्लेषिकी', 'analytics.subtitle': 'अपने प्रशिक्षण डेटा और प्रगति मीट्रिक में गहराई से गोता लगाएँ।', 'analytics.volumeProgression': 'वॉल्यूम प्रगति', 'analytics.intensityDistribution': 'तीव्रता वितरण', 'analytics.recoveryTrends': 'रिकवरी रुझान',
  'analytics.muscleActivation': 'मांसपेशी सक्रियण', 'analytics.1rmProjections': '1RM अनुमान', 'analytics.velocityProfile': 'वेग प्रोफ़ाइल', 'analytics.exportData': 'डेटा निर्यात करें', 'analytics.generateReport': 'रिपोर्ट तैयार करें',
  'analytics.timeframe': 'समय सीमा', 'analytics.1m': '1महीना', 'analytics.3m': '3महीने', 'analytics.6m': '6महीने', 'analytics.1y': '1साल', 'analytics.all': 'सभी',
  'analytics.squat': 'स्क्वाट', 'analytics.bench': 'बेंच', 'analytics.deadlift': 'डेडलिफ्ट', 'analytics.total': 'कुल',
  'analytics.volume': 'वॉल्यूम', 'analytics.intensity': 'तीव्रता (%)', 'analytics.recoveryScore': 'रिकवरी स्कोर', 'analytics.activation': 'सक्रियण (%)', 'analytics.projected1rm': 'अनुमानित 1RM', 'analytics.velocity': 'वेग (m/s)'
};

const nl = {
  'stage.arnold': 'Arnold Classic', 'stage.uspl': 'USPL Nationals', 'stage.desert': 'The Dust Bowl', 'stage.space': 'Lunar Station 4',
  'stage.squat': 'Squat', 'stage.benchPress': 'Bankdrukken', 'stage.deadlift': 'Deadlift',
  'stage.beltTension': 'Riemspanning Geverifieerd', 'stage.kneeSleeves': 'Kniebanden Beveiligd', 'stage.wristWraps': 'Polsbanden Vergrendeld', 'stage.chalkApplied': 'Krijt Toegepast', 'stage.mentalFocus': 'Mentale Focus Gekalibreerd', 'stage.safetySpotters': 'Veiligheidsspotters Klaar',
  'stage.competitionSetup': 'Competitie Setup', 'stage.selectEnvironment': 'Selecteer Omgeving', 'stage.chooseBattleground': 'Kies je slagveld. Fysica en verlichting zullen zich dienovereenkomstig aanpassen.', 'stage.selected': 'Geselecteerd', 'stage.select': 'Selecteer',
  'stage.nextProtocol': 'Volgende: Protocol', 'stage.protocolConfig': 'Protocolconfiguratie', 'stage.setTargetLoads': 'Stel je doelbelastingen in voor de komende sessie.', 'stage.backEnvironment': 'Terug naar Omgeving',
  'stage.nextPreFlight': 'Volgende: Pre-Flight', 'stage.preFlightChecklist': 'Pre-Flight Checklist', 'stage.verifySystems': 'Verifieer alle systemen voordat u de reeks start.', 'stage.backProtocol': 'Terug naar Protocol',
  'stage.initiateSequence': 'Start Reeks', 'stage.termsOfEngagement': 'Voorwaarden van Betrokkenheid', 'stage.termsMessage': 'Door door te gaan, erkent u de fysieke risico\'s die gepaard gaan met het tillen van maximale belastingen. Vanguard aanvaardt geen aansprakelijkheid voor CZS-vermoeidheid, musculoskeletale schade of gekneusde ego\'s.', 'stage.iAccept': 'Ik Accepteer de Risico\'s', 'stage.cancel': 'Annuleren',
  'stage.withdrawTitle': 'Terugtrekken uit Competitie?', 'stage.withdrawMessage': 'Weet je zeker dat je de reeks wilt afbreken? Je huidige setup gaat verloren.', 'stage.withdraw': 'Terugtrekken', 'stage.stay': 'Blijven',
  'stage.ready': 'KLAAR', 'stage.targetLoad': 'Doelbelasting', 'stage.heartRate': 'Hartslag', 'stage.bpm': 'BPM', 'stage.vo2Max': 'VO2 Max', 'stage.peak': 'Piek',
  'stage.bodyTemp': 'Lichaamstemp', 'stage.cnsStatus': 'CZS Status', 'stage.optimal': 'Optimaal', 'stage.stabilityLock': 'Stabiliteitsslot', 'stage.engaged': 'Ingeschakeld', 'stage.abortSequence': 'Reeks Afbreken',
  'hud.berserkerState': 'Berserker_Staat', 'hud.active': 'Actief', 'hud.heartRate': 'Hartslag', 'hud.bpm': 'BPM', 'hud.kineticSurge': 'Kinetische_Golf', 'hud.completeLift': 'Voltooi Lift', 'hud.maxCapacity': 'Maximale Capaciteit Bereikt',
  'hud.peakPower': 'Piekvermogen', 'hud.w': 'W', 'hud.stabilityIndex': 'Stabiliteitsindex', 'hud.critical': 'Kritiek',
  'safety.dangerDetected': 'GEVAAR GEDETECTEERD', 'safety.formBreakdown': 'Vormafbraak op handen. Snelheidsdaling overschrijdt veiligheidsdrempel.', 'safety.yesOk': 'Ja - Ik ben OK', 'safety.cancelAlert': 'Waarschuwing Annuleren', 'safety.abortLift': 'Lift Afbreken', 'safety.deploySpotters': 'Spotters Inzetten',
  'analytics.title': 'Prestatieanalyse', 'analytics.subtitle': 'Duik diep in je trainingsgegevens en voortgangsstatistieken.', 'analytics.volumeProgression': 'Volumeprogressie', 'analytics.intensityDistribution': 'Intensiteitsverdeling', 'analytics.recoveryTrends': 'Hersteltrends',
  'analytics.muscleActivation': 'Spieractivatie', 'analytics.1rmProjections': '1RM Projecties', 'analytics.velocityProfile': 'Snelheidsprofiel', 'analytics.exportData': 'Gegevens Exporteren', 'analytics.generateReport': 'Rapport Genereren',
  'analytics.timeframe': 'Tijdsbestek', 'analytics.1m': '1M', 'analytics.3m': '3M', 'analytics.6m': '6M', 'analytics.1y': '1J', 'analytics.all': 'ALLES',
  'analytics.squat': 'Squat', 'analytics.bench': 'Bank', 'analytics.deadlift': 'Deadlift', 'analytics.total': 'Totaal',
  'analytics.volume': 'Volume', 'analytics.intensity': 'Intensiteit (%)', 'analytics.recoveryScore': 'Herstelscore', 'analytics.activation': 'Activatie (%)', 'analytics.projected1rm': 'Geprojecteerde 1RM', 'analytics.velocity': 'Snelheid (m/s)'
};

const translations = { en, zh, ko, ja, es, hi, nl };

let content = fs.readFileSync('src/contexts/SettingsContext.tsx', 'utf8');

for (const lang of Object.keys(translations)) {
  const langTranslations = translations[lang];
  let newLangContent = `  ${lang}: {\n`;
  
  // Extract existing translations for this language
  const regex = new RegExp(`  ${lang}: \\{([\\s\\S]*?)\\n  \\},?\\n`);
  const match = content.match(regex);
  if (match) {
    const existing = match[1];
    newLangContent += existing + ',\n';
  }
  
  for (const key of Object.keys(langTranslations)) {
    newLangContent += `    '${key}': '${langTranslations[key].replace(/'/g, "\\'")}',\n`;
  }
  newLangContent += `  },`;
  
  content = content.replace(regex, newLangContent + '\n');
}

fs.writeFileSync('src/contexts/SettingsContext.tsx', content);
