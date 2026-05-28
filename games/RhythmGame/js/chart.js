// chart.js - 谱面系统（程序化生成节拍谱面）
import { CONFIG } from './config.js';
import { Note } from './note.js';

export class ChartGenerator {
  constructor() {
    this.notes = [];
    this.difficulty = null;
    this.totalNotes = 0;
  }

  /**
   * 生成谱面
   * @param {string} diffKey - 'easy', 'hard', 'hell'
   * @returns {Note[]}
   */
  generate(diffKey) {
    this.difficulty = CONFIG.DIFFICULTY[diffKey];
    this.notes = [];

    const bpm = this.difficulty.bpm;
    const beatDuration = 60000 / bpm; // 每拍毫秒
    const totalBeats = CONFIG.BGM.bars * CONFIG.BGM.beatsPerBar;
    const totalMs = totalBeats * beatDuration;

    // 使用确定性随机种子
    let seed = this._hashStr(diffKey + bpm);
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };

    // 按拍生成音符
    for (let beat = 0; beat < totalBeats; beat++) {
      const beatTime = beat * beatDuration;

      // 每拍开头有概率放音符
      if (rand() < this.difficulty.noteDensity) {
        const lane = Math.floor(rand() * CONFIG.LANE_COUNT);
        const noteType = this._pickNoteType(rand);
        const slideDir = noteType === 'slide' ? (rand() > 0.5 ? 1 : -1) : 0;

        const note = new Note({
          type: noteType,
          lane: lane,
          time: beatTime + 2000, // 2秒延迟让玩家准备
          duration: noteType === 'hold' ? beatDuration * (1 + Math.floor(rand() * 3)) : 0,
          slideDir: slideDir,
        });
        this.notes.push(note);
      }

      // 双押检测
      if (rand() < this.difficulty.doubleChance) {
        const lane1 = Math.floor(rand() * CONFIG.LANE_COUNT);
        let lane2 = (lane1 + 1 + Math.floor(rand() * (CONFIG.LANE_COUNT - 1))) % CONFIG.LANE_COUNT;
        const note = new Note({
          type: 'tap',
          lane: lane2,
          time: beatTime + 2000,
        });
        this.notes.push(note);
      }

      // 半拍细分（困难以上）
      if (diffKey !== 'easy' && rand() < this.difficulty.noteDensity * 0.4) {
        const halfBeatTime = beatTime + beatDuration / 2;
        const lane = Math.floor(rand() * CONFIG.LANE_COUNT);
        const note = new Note({
          type: 'tap',
          lane: lane,
          time: halfBeatTime + 2000,
        });
        this.notes.push(note);
      }

      // 16分音符（地狱难度）
      if (diffKey === 'hell' && rand() < 0.15) {
        for (let sub = 1; sub <= 3; sub++) {
          const subTime = beatTime + (beatDuration / 4) * sub;
          const lane = Math.floor(rand() * CONFIG.LANE_COUNT);
          const note = new Note({
            type: rand() > 0.8 ? 'slide' : 'tap',
            lane: lane,
            time: subTime + 2000,
            slideDir: rand() > 0.5 ? 1 : -1,
          });
          this.notes.push(note);
        }
      }
    }

    // 按时间排序
    this.notes.sort((a, b) => a.time - b.time);
    this.totalNotes = this.notes.length;
    return this.notes;
  }

  _pickNoteType(rand) {
    const r = rand();
    if (r < this.difficulty.holdChance) return 'hold';
    if (r < this.difficulty.holdChance + this.difficulty.slideChance) return 'slide';
    return 'tap';
  }

  _hashStr(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return Math.abs(hash) || 1;
  }
}
