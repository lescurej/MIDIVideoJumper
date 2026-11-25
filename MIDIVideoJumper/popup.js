const STORAGE_DEVICE = 'midiSelectedDevice';
const STORAGE_PAUSE_ON_RELEASE = 'midiPauseOnRelease';
const STORAGE_MIDI_CHANNEL = 'midiChannel';
const STORAGE_VELOCITY_CONTROLS_SPEED = 'midiVelocityControlsSpeed';

document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab?.url?.includes('youtube.com')) {
            return;
        }
        document.getElementById('not-youtube').classList.add('hidden');
        document.getElementById('midi-content').classList.remove('hidden');

        const select = document.getElementById('midi-select');
        const channelSelect = document.getElementById('channel-select');
        const status = document.getElementById('midi-status');
        const notesDisplay = document.getElementById('midi-notes-display');
        const pauseCb = document.getElementById('pause-on-release');
        const velocitySpeedCb = document.getElementById('velocity-controls-speed');

        channelSelect.innerHTML = '<option value="all">All</option>' + Array.from({ length: 16 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');

        select.addEventListener('change', (e) => {
            const deviceId = e.target.value || null;
            chrome.storage.local.set({ [STORAGE_DEVICE]: deviceId });
            chrome.tabs.sendMessage(tab.id, { type: 'setDevice', deviceId });
        });

        pauseCb.addEventListener('change', (e) => {
            const val = e.target.checked;
            chrome.storage.local.set({ [STORAGE_PAUSE_ON_RELEASE]: val });
            chrome.tabs.sendMessage(tab.id, { type: 'setPauseOnRelease', value: val });
        });

        channelSelect.addEventListener('change', (e) => {
            const val = e.target.value === 'all' ? null : parseInt(e.target.value, 10) - 1;
            chrome.storage.local.set({ [STORAGE_MIDI_CHANNEL]: e.target.value === 'all' ? 'all' : e.target.value });
            chrome.tabs.sendMessage(tab.id, { type: 'setChannel', channel: val });
        });

        velocitySpeedCb.addEventListener('change', (e) => {
            const val = e.target.checked;
            chrome.storage.local.set({ [STORAGE_VELOCITY_CONTROLS_SPEED]: val });
            chrome.tabs.sendMessage(tab.id, { type: 'setVelocityControlsSpeed', value: val });
        });

        let prevDeviceIds = '';
        function refreshState() {
            chrome.tabs.sendMessage(tab.id, { type: 'getState' }, (state) => {
                if (chrome.runtime.lastError) {
                    status.textContent = 'Reload the YouTube page';
                    return;
                }
                if (!state) return;
                const deviceIds = (state.devices || []).map(d => d.id).join(',');
                if (deviceIds !== prevDeviceIds) {
                    prevDeviceIds = deviceIds;
                    select.innerHTML = '<option value="">-- Select MIDI input --</option>';
                    for (const d of state.devices || []) {
                        const opt = document.createElement('option');
                        opt.value = d.id;
                        opt.textContent = d.name;
                        select.appendChild(opt);
                    }
                }
                select.value = state.selectedDevice || '';
                status.textContent = state.selectedDevice ? 'Connected' : 'Select a device';
                pauseCb.checked = state.pauseOnRelease !== false;
                velocitySpeedCb.checked = state.velocityControlsSpeed === true;
                const ch = state.channel;
                channelSelect.value = ch === null || ch === undefined ? 'all' : String(Math.max(1, Math.min(16, ch + 1)));
                updateNotesDisplay(notesDisplay, state.lastNote);
            });
        }

        refreshState();
        const poll = setInterval(refreshState, 300);
        window.addEventListener('unload', () => clearInterval(poll));
    });
});

function updateNotesDisplay(el, note) {
    if (note === null || note === undefined) {
        el.textContent = '--';
        el.classList.remove('active');
    } else {
        const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        el.textContent = names[note % 12] + (Math.floor(note / 12) - 1);
        el.classList.add('active');
    }
}
