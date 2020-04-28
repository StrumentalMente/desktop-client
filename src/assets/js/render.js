/*
 * Copyright 2019 FSC
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @file render.js
 *
 * Funzioni per il rendering della pagina.
 *
 * E il file principale del _rendering_ dell'applicazione. Contiene tutte le
 * funzioni da eseguire nel "rendering process" (processo di rendering) di
 * Electron.
 */

/** v. https://gist.github.com/paulcbetts/da85dd246db944c32427d72026192b41 */
(function () {
	// Include this at the very top of both your main and window processes, so
	// that it loads as soon as possible.
	//
	// Why does this work? The node.js module system calls fs.realpathSync a
	// _lot_ to load stuff, which in turn, has to call fs.lstatSync a _lot_.
	// While you generally can't cache stat() results because they change behind
	// your back (i.e. another program opens a file, then you stat it, the stats
	// change), caching it for a very short period of time is :ok: :gem:. These
	// effects are especially apparent on Windows, where stat() is far more
	// expensive - stat() calls often take more time in the perf graph than
	// actually evaluating the code!!

	// npm install lru-cache first
	if (typeof parent.require !== 'undefined') {
		const LRU = parent.require('lru-cache');
		var lru = new LRU({ max: 256, maxAge: 250/*ms*/ });

		var fs = parent.require('fs');
		var origLstat = fs.lstatSync.bind(fs);

		// NB: The biggest offender of thrashing lstatSync is the node module system
		// itself, which we can't get into via any sane means.
		fs.lstatSync = function (p) {
			let r = lru.get(p);
			if (r) return r;

			r = origLstat(p);
			lru.set(p, r);
			return r;
		};
	}
})();

const remote = (typeof window.parent.require !== 'undefined') && window.parent.require('electron').remote; // Riferimento a Electron



/**
 * Mostra un messaggio all'utente se il quiz propedeutico all'argomento scelto
 * non è stato completato. Se l'utente conferma di voler proseguire, viene
 * effettuata l'azione richiesta, altrimenti non si attua alcuna azione.
 *
 * @param {String} previousQuizId L'id del quiz propedeutico
 * @param {String} previousQuizName Il nome del quiz (da comunicare all'utente)
 * @param {String} topicToOpenName Il nome dell'argomento che si vuole aprire
 * @param {*} callback La funzione da eseguire se l'utente accetta di
 * proseguire.
 */
function warnIfIncomplete(previousQuizId, previousQuizName, topicToOpenName, callback) {
	const { ipcRenderer } = window.parent.require("electron");
	var result = ipcRenderer.sendSync("get-quiz", previousQuizId);
	if (!result) {
		let answer = JSON.parse(sessionStorage.getItem(`${topicToOpenName}-notdone-asked`));
		if (!answer) {
			const Dialog = window.parent.require("./assets/js/modal-dialog-module");
			let warningDialog = new Dialog;
			warningDialog.open({
				title: 'Attenzione!',
				content: `<p>Hai scelto di proseguire <em>${topicToOpenName}</em> senza aver completato il quiz di <em>${previousQuizName}</em>! Sei sicuro di voler continuare?</p>`,
				buttons: {
					"No": {
						style: "btn-outlined",
						autofocus: false,
						callback: () => { warningDialog.close(); }
					},
					"Sì": {
						style: "btn",
						autofocus: true,
						callback: () => {
							sessionStorage.setItem(`${topicToOpenName}-notdone-asked`, "true");
							callback();
							warningDialog.close();
						}
					}
				}
			});
		}
		else
			callback();
	}
	else
		callback();
}

/**
 * Gestisce gli eventi della titlebar.
 * 
 * Questa funzione gestisce gli eventi (riduci a icona, massimizza/minimizza,
 * chiudi) che sono acessibili tramite la titlebar.
 */
function setUpTitleBar() {
	// Quando il documento ha terminato il caricamento, inizializza
	let onStateListener = () => {
		if (parent.document.readyState == "complete") {
			init();
			parent.document.removeEventListener("readystatechange", onStateListener);
		}
	}
	parent.document.addEventListener("readystatechange", onStateListener);
	// parent.document.onreadystatechange = () => {
	// 	if (parent.document.readyState == "complete") {
	// 		init();
	// 	}
	// };
	// parent.document.onreadystatechange = () => {
	// 	if (parent.document.readyState == "complete") {
	// 		init();
	// 	}
	// };

	let window = remote.getCurrentWindow();
	const minButton = parent.document.getElementById('min-button'),
		maxButton = parent.document.getElementById('max-button'),
		restoreButton = parent.document.getElementById('restore-button'),
		closeButton = parent.document.getElementById('close-button'),
		titleText = parent.document.getElementById('window-title-text');

	/**
	 * Inizializza la titlebar.
	 */
	function init() {

		titleText.innerHTML = window.getTitle();

		let minimize = event => window.minimize();
		let maximize = event => { window.maximize(); toggleMaxRestoreButtons(); };
		let restore = event => { window.unmaximize(); toggleMaxRestoreButtons(); };
		let close = event => {
			if (closeButton.classList.contains("sub-window"))
				window.close();
			else
				showExitDialog();
		};

		if (minButton) {
			minButton.onclick = minimize;
		}

		if (maxButton) {
			maxButton.onclick = maximize;
		}

		if (restoreButton) {
			restoreButton.onclick = restore;
		}

        /* 
         * Switch tra i bottoni massimizza/ripristina quando avviene la
         * massimizzazione/ripristino della finestra per mezzo di azioni
         * diverse dal click del tasto apposito (es: doppio click della
         * barra del titolo).
         */
		if (minButton && restoreButton) {
			toggleMaxRestoreButtons();
		}

		closeButton.onclick = close;
	}

	/**
	 * Cicla tra i bottoni di massimizzazione e di
	 * minimizzazione della finestra alternativamente
	 */
	function toggleMaxRestoreButtons() {
		if (window.isMaximized()) {
			maxButton.style.display = "none";
			restoreButton.style.display = "flex";
		} else {
			restoreButton.style.display = "none";
			maxButton.style.display = "flex";
		}
	}
	setUpTitleBar.updateTitleBarButtons = toggleMaxRestoreButtons;
}

remote && setUpTitleBar();

function updateTitleBarButtons() {
	setUpTitleBar.updateTitleBarButtons();
}

/**
 * Apre un link nel browser predefinito.
 *
 * @param {String} link Il link da aprire
 */
function openInBrowser(link) {
	document.activeElement.blur();
	remote.shell.openExternal(link);
}

/**
 * Ritorna l'username collegato a StrumentalMente.
 */
function getUsername() {
	const { ipcRenderer } = window.parent.require("electron");
	let user = ipcRenderer.sendSync("get-user");
	return user;
}

/**
 * Imposta l'username dell'utente.
 *
 * @param {String} newUsername Il nuovo username. 
 */
function setUsername(newUsername) {
	const { ipcRenderer } = window.parent.require("electron");
	ipcRenderer.sendSync("save-user", newUsername);
	console.log("done");
}

/**
 * Ottiene il risultato del quiz scelto
 *
 * @param {String} id L'id del quiz di cui interessa il risultato.
 */
function getQuiz(id) {
	const { ipcRenderer } = window.parent.require("electron");
	let quiz = ipcRenderer.sendSync("get-quiz", id);
	return quiz;
}

function openUrl(href) {
	parent.require("electron").remote.getCurrentWindow().loadFile(href);
}