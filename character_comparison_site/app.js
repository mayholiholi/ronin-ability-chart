document.addEventListener('DOMContentLoaded', function () {
    var segmentGroup = document.getElementById('segmentGroup');
    var panelWrap = document.getElementById('panelWrap');
    var chartCard = document.getElementById('chartCard');
    var emptyMsg = document.getElementById('emptyMsg');
    var clearBtn = document.getElementById('clearBtn');
    var counterEl = document.getElementById('counter');
    var ctx = document.getElementById('radarChart').getContext('2d');
    var characters = [];
    var chart = null;

    var factions = ['倒幕', '佐幕', '海外', 'その他'];

    // 名前から決定的に色を生成
    function nameToColor(name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        var h = ((hash % 360) + 360) % 360;
        return {
            bg: 'hsla(' + h + ', 70%, 55%, 0.2)',
            border: 'hsl(' + h + ', 70%, 45%)'
        };
    }

    function getAllCheckboxes() {
        return panelWrap.querySelectorAll('input[type="checkbox"]');
    }

    function getSelected() {
        return Array.from(
            panelWrap.querySelectorAll('input[type="checkbox"]:checked')
        ).map(function (cb) { return cb.value; });
    }

    function updateCounter(count) {
        if (count > 0) {
            counterEl.innerHTML = '<b>' + count + '人</b>を選択中';
        } else {
            counterEl.textContent = '';
        }
    }

    function updateChart() {
        var selected = getSelected();
        updateCounter(selected.length);

        if (selected.length === 0) {
            chartCard.style.display = 'none';
            emptyMsg.style.display = '';
            if (chart) {
                chart.destroy();
                chart = null;
            }
            return;
        }

        chartCard.style.display = '';
        emptyMsg.style.display = 'none';

        var data = characters.filter(function (c) {
            return selected.includes(c.Name);
        });

        var labels = ['武勇', '技能', '魅力', '知略'];
        var datasets = data.map(function (c) {
            var color = nameToColor(c.Name);
            return {
                label: c.Name,
                data: [c.武勇, c.技能, c.魅力, c.知略],
                backgroundColor: color.bg,
                borderColor: color.border,
                borderWidth: 2
            };
        });

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                scales: {
                    r: {
                        min: 30,
                        max: 100,
                        ticks: { stepSize: 10 }
                    }
                }
            }
        });
    }

    // セグメントタブの切り替え
    function switchTab(faction) {
        segmentGroup.querySelectorAll('.segment-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.faction === faction);
        });
        panelWrap.querySelectorAll('.panel').forEach(function (panel) {
            panel.classList.toggle('active', panel.dataset.faction === faction);
        });
    }

    // セグメントタブを生成
    function buildSegments() {
        factions.forEach(function (faction, idx) {
            var count = characters.filter(function (c) { return c.Faction === faction; }).length;
            var btn = document.createElement('button');
            btn.className = 'segment-btn' + (idx === 0 ? ' active' : '');
            btn.dataset.faction = faction;
            btn.innerHTML = faction + ' <span class="seg-count">' + count + '</span>';
            btn.addEventListener('click', function () { switchTab(faction); });
            segmentGroup.appendChild(btn);
        });
    }

    // パネルとチップを生成
    function buildPanels() {
        factions.forEach(function (faction, idx) {
            var panel = document.createElement('div');
            panel.className = 'panel card' + (idx === 0 ? ' active' : '');
            panel.dataset.faction = faction;

            var title = document.createElement('div');
            title.className = 'card-title';
            title.textContent = faction;
            panel.appendChild(title);

            var wrap = document.createElement('div');
            wrap.className = 'chip-wrap';

            characters
                .filter(function (c) { return c.Faction === faction; })
                .forEach(function (c) {
                    var chip = document.createElement('div');
                    chip.className = 'chip';
                    chip.dataset.faction = faction;

                    var cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.id = 'char-' + c.Name;
                    cb.value = c.Name;
                    cb.addEventListener('change', updateChart);

                    var label = document.createElement('label');
                    label.className = 'chip-label';
                    label.htmlFor = 'char-' + c.Name;
                    label.textContent = c.Name;

                    chip.appendChild(cb);
                    chip.appendChild(label);
                    wrap.appendChild(chip);
                });

            panel.appendChild(wrap);
            panelWrap.appendChild(panel);
        });
    }

    clearBtn.addEventListener('click', function () {
        getAllCheckboxes().forEach(function (cb) { cb.checked = false; });
        updateChart();
    });

    fetch('characters.json')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            characters = data;
            buildSegments();
            buildPanels();
        })
        .catch(function (err) {
            panelWrap.textContent = 'データの読み込みに失敗しました';
            console.error(err);
        });
});
