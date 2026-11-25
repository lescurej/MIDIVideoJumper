const NOTE_ON = 144;
const NOTE_OFF = 128;
const START_NOTE = 21;
const END_NOTE = 108;
const NOTE_SPAN = END_NOTE - START_NOTE;
const STORAGE_DEVICE = 'midiSelectedDevice';
const STORAGE_PAUSE_ON_RELEASE = 'midiPauseOnRelease';
const STORAGE_MIDI_CHANNEL = 'midiChannel';
const STORAGE_VELOCITY_CONTROLS_SPEED = 'midiVelocityControlsSpeed';

const MIN_PLAYBACK_RATE = 0.25;
const MAX_PLAYBACK_RATE = 2;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

let midiAccess = null;
let activeInput = null;
let lastNote = null;
let lastNoteTimer = null;
let isPaused = false;
let pauseOnRelease = true;
let midiChannel = null;
let velocityControlsSpeed = false;

function init() {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg.type === 'getState') {
            sendResponse({ devices: getDevices(), selectedDevice: activeInput?.id || null, pauseOnRelease, lastNote, channel: midiChannel, velocityControlsSpeed });
        } else if (msg.type === 'setDevice') {
            connectToInput(msg.deviceId);
            sendResponse({ ok: true });
        } else if (msg.type === 'setPauseOnRelease') {
            pauseOnRelease = msg.value;
            sendResponse({ ok: true });
        } else if (msg.type === 'setChannel') {
            midiChannel = msg.channel;
            sendResponse({ ok: true });
        } else if (msg.type === 'setVelocityControlsSpeed') {
            velocityControlsSpeed = msg.value;
            const video = document.querySelector('video');
            if (video && !msg.value) video.playbackRate = 1;
            sendResponse({ ok: true });
        }
        return true;
    });
}

function getDevices() {
    if (!midiAccess) return [];
    return Array.from(midiAccess.inputs.values()).map(i => ({ id: i.id, name: i.name || i.id }));
}

function connectToInput(deviceId) {
    if (activeInput) {
        activeInput.onmidimessage = null;
        activeInput = null;
    }
    lastNote = null;

    if (!deviceId || !midiAccess) return;

    const input = midiAccess.inputs.get(deviceId);
    if (!input) return;

    activeInput = input;
    activeInput.onmidimessage = onMIDIMessage;
}

function onMIDISuccess(access) {
    midiAccess = access;

    midiAccess.onstatechange = () => {
        const selectId = activeInput?.id;
        if (selectId && !midiAccess.inputs.has(selectId)) {
            connectToInput(null);
        }
    };

    chrome.storage.local.get([STORAGE_DEVICE, STORAGE_PAUSE_ON_RELEASE, STORAGE_MIDI_CHANNEL, STORAGE_VELOCITY_CONTROLS_SPEED], (data) => {
        pauseOnRelease = data[STORAGE_PAUSE_ON_RELEASE] !== false;
        velocityControlsSpeed = data[STORAGE_VELOCITY_CONTROLS_SPEED] === true;
        const ch = data[STORAGE_MIDI_CHANNEL];
        midiChannel = ch === 'all' || ch == null || ch === '' ? null : parseInt(ch, 10) - 1;
        const saved = data[STORAGE_DEVICE];
        if (saved && midiAccess.inputs.has(saved)) {
            connectToInput(saved);
        }
    });
}

function onMIDIFailure() { }

function onMIDIMessage(message) {
    const [statusByte, note, velocity = 0] = message.data;
    const statusType = statusByte & 0xf0;
    const channel = statusByte & 0x0f;
    if (statusType !== NOTE_ON && statusType !== NOTE_OFF) return;
    if (midiChannel !== null && channel !== midiChannel) return;

    const isNoteOn = statusType === NOTE_ON && velocity > 0;
    lastNote = note;
    clearTimeout(lastNoteTimer);
    lastNoteTimer = setTimeout(() => { lastNote = null; }, 1000);
    const video = document.querySelector('video');

    const playVideo = () => {
        video.play();
        isPaused = false;
    }

    const pauseVideo = () => {
        video.pause();
        isPaused = true;
    }

    if (isNoteOn) {
        if (!video) return;
        const pct = Math.min(1, Math.max(0, (note - START_NOTE) / NOTE_SPAN));
        video.currentTime = video.duration * pct;
        if (velocityControlsSpeed && velocity > 0) {
            const rate = MIN_PLAYBACK_RATE + (velocity / 127) * (MAX_PLAYBACK_RATE - MIN_PLAYBACK_RATE);
            video.playbackRate = Math.min(MAX_PLAYBACK_RATE, Math.max(MIN_PLAYBACK_RATE, rate));
        } else {
            video.playbackRate = 1;
        }
        if (isPaused) {
            playVideo();
        }
    } else {
        if (pauseOnRelease) {
            if (!isPaused) {
                pauseVideo();
            }
        }
    }
}

init();
