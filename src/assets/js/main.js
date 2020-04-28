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
 * @file main.js
 *
 * Contiene tutte le funzioni che servono a dare dinamicità alle pagine HTML
 * dell'applicazione. 
 */

/**
 * Apre la navbar in modalità "mobile". Questa funzione è mantenuta solo per
 * consentire un eventuale eccessivo ridimensionamento della finestra.
 */
function openMobileNavigation() {
	var button = document.getElementById("sidebar-controller");
	var nav = document.getElementById("main-nav");
	if (nav.className === "main-navigation") {
		nav.className += " responsive";
		button.innerHTML = "<i class=\"fas fa-times\"></i>";
		button.setAttribute("title", "Chiudi la sidebar");
	}
	else {
		nav.className = "main-navigation";
		button.innerHTML = "<i class=\"fas fa-bars\"></i>";
		button.setAttribute("title", "Apri la sidebar");
	}
}

var numberOfSections = 0, currentSection = 0;
var returnToLast = false;
var initialPage = "", baseFolder = "./";
var audioSourcesList = [];
var pagesName = {
	previous: "Argomento Precedente",
	previousLink: "argomento-successivo",
	next: "Argomento Successivo",
	nextLink: "argomento-precedente"
};
var canChangeSlide = true;

/**
 * Cambia i link e i nomi dell'argomento precedente e quello successivo a quello
 * attuale
 *
 * @param {number} firstSlideNumber Il numero della prima slide dell'argomento
 * corrente
 * @param {Object} links Le nuove impostazioni e link
 * @param {String} links.previous Il nome della pagina precedente
 * @param {String} links.previousLink Il link della pagina precedente (il nome
 * del file *senza* l'estensione)
 * @param {String} links.next Il nome della pagina successiva
 * @param {String} links.nextLink Il link della pagina successiva (il nome del
 * file *senza* l'estensione)
 */
function setLinks(firstSlideNumber, links) {
	sessionStorage.currentSlide = firstSlideNumber;
	pagesName = links;
	initialize(initialPage, baseFolder);
}

let isBlindAudioEnded = false;
/**
 * Aggiorna la sorgente dell'audio per ciechi in base alla sezione corrente.
 *
 * Il comportamento che segue è il seguente (descritto in pseudocodice):
 *
 * if è_in_pausa AND cambia_slide then pausa() elseif è_in_play AND cambia_slide
 * then play() elseif è_finito AND non_stoppato AND cambia_slide then play()
 * elseif cambia_argomento then pausa()
 *
 * @param {String} newSource La nuova sorgente per l'audio
 */
function updateBlindAudio(newSource) {
	let iFrame = parent.document.getElementById("content-frame");
	let iFrameDocument = iFrame.contentWindow.document || iFrame.contentDocument;
	iFrame = iFrameDocument.getElementById("topic-frame");
	iFrameDocument = iFrame.contentWindow.document || iFrame.contentDocument;
	let audio = iFrameDocument.getElementById("blind-audio");
	if (audio) {
		let paused = audio.paused && !audio.ended;
		audio.pause();
		audio.src = newSource ? newSource : audio.src;
		audio.load();
		if (!paused || isBlindAudioEnded) {
			audio.currentTime = 0;
			audio.play();
			isBlindAudioEnded = false;
		}
	}
}

function endBlindAudio() {
	isBlindAudioEnded = true;
}

/**
 * Funzione che, al caricamento della pagina, si occupa di impostare il numero
 * di tag section presenti all'interno della pagina nella memoria locale del
 * browser, di impostare come sezione visibile corrente la prima (sempre
 * all'interno della memoria locale) e di nascondere tutti i tag section
 * successivi al primo.
 *
 * @param {String} initial Il primo argomento
 * @param {String} base La cartella in cui sono situati i file degli argomenti
 * (default: `./`)
 * @param {number} totalNumberOfSlides Il numero totale di pagine per la
 * sezione.
 */
function initialize(initial, base = "./", totalNumberOfSlides = undefined) {
	initialPage = initial;
	baseFolder = base;
	currentSection = 0;
	audioSourcesList = [];

	var iFrame = document.getElementById("topic-frame");
	setShortcuts(iFrame.contentWindow);
	var iFrameDocument = iFrame.contentWindow.document || iFrame.contentDocument;
	var sections = iFrameDocument.getElementsByTagName("section");
	numberOfSections = sections.length;
	for (var i = 0; i < numberOfSections; i++) {
		let element = sections[i].getElementsByTagName("audio")[0];
		element && audioSourcesList.push(element.src);
	}

	if (iFrameDocument.getElementById("list") == undefined) {
		iFrameDocument.getElementsByTagName("section")[0].className = "";
		updateBlindAudio(audioSourcesList[0]);
	}
	iFrameDocument.getElementById("max-topic-slides").innerHTML = numberOfSections;
	iFrameDocument.getElementById("current-topic-slide").innerHTML = currentSection + 1;
	let updateCurrentSlide = (delta) => {
		sessionStorage.currentSlide = Number(sessionStorage.currentSlide) + delta;
		iFrameDocument.getElementById("current-slide-number").innerHTML = sessionStorage.currentSlide;
	};
	updateCurrentSlide(0);

	var previousTopicButton = document.getElementById("back-topic"),
		previousSlideButton = document.getElementById("back"),
		returnToListButton = document.getElementById("back-to-list"),
		nextSlideButton = document.getElementById("next"),
		nextTopicButton = document.getElementById("next-topic");

	if (totalNumberOfSlides != undefined) {
		sessionStorage.totalNumberOfSlides = totalNumberOfSlides;
		sessionStorage.currentSlide = 1;
	}
	else {
		totalNumberOfSlides = sessionStorage.totalNumberOfSlides;
	}

	iFrameDocument.getElementById("total-slides-number").innerHTML = totalNumberOfSlides;

	if (iFrame.src.includes(base + initial + ".html")) {
		numberOfSections = 1;
		previousSlideButton.style.display = "none";

		nextSlideButton.style.display = "none";
		nextTopicButton.style.display = "inline-block";

		returnToListButton.style.display = "none";
		returnToListButton.toggleAttribute("disabled", true);
	}
	else {
		if (iFrameDocument.getElementById("list") == undefined)
			iFrameDocument.getElementsByTagName("section")[0].className = "";
		previousSlideButton.toggleAttribute("disabled", false);
		returnToListButton.style.display = "inline-block";
		returnToListButton.toggleAttribute("disabled", false);

		if (currentSection === 0) {
			previousTopicButton.style.display = "inline-block";
			previousSlideButton.style.display = "none";
		}
		else if (currentSection <= numberOfSections - 1) {
			previousSlideButton.style.display = "inline-block";
			previousTopicButton.style.display = "none";
		}

		if (currentSection === numberOfSections - 1) {
			nextTopicButton.style.display = "inline-block";
			nextSlideButton.style.display = "none";
		}
		else if (currentSection >= 0) {
			nextSlideButton.style.display = "inline-block";
			nextTopicButton.style.display = "none";
		}
	}

	if (returnToLast && currentSection != numberOfSections - 1) {
		changeSlide(numberOfSections - 1);
		returnToLast = false;
	}

	previousTopicButton.innerHTML = pagesName.previous + " <i class=\"btn-icon left fas fa-arrow-alt-circle-left\"></i>";
	nextTopicButton.innerHTML = pagesName.next + " <i class=\"btn-icon fas fa-arrow-circle-right\"></i>";

	/**
	 *  La funzione, in base al valore assunto da slide cambia la sezione
	 *  corrente in quella richiesta. Inoltre si occupa di aggiornare il numero
	 *  della slide corrente nella memoria temporanea del browser. Inoltre, in
	 *  base al numero di slide, si occupa di rendere visibili (o nascondere) i
	 *  relativi pulsanti di spostamento (avanti con id next, indietro con id
	 *  back e quiz con id quiz).
	 *
	 *  @param {numer} slide Il numero della slide da aprire.
	 */
	function changeSlide(slide) {
		updateCurrentSlide(slide - currentSection);
		if (iFrameDocument.getElementsByClassName("multiple-figures").length < 1)
			iFrameDocument.getElementsByTagName("section")[currentSection].className = "hide";

		// Ferma i video e gli audio in play
		let isPlaying = (el) => { return !!(el.currentTime > 0 && !el.paused && !el.ended && el.readyState > 2); };
		var videoList = Array.from(iFrameDocument.getElementsByTagName("video"));
		videoList.forEach(video => {
			let isPlaying = (el) => { return !!(el.currentTime > 0 && !el.paused && !el.ended && el.readyState > 2); };
			video.pause();
		});
		var audioList = Array.from(iFrameDocument.getElementsByTagName("audio"));
		audioList.forEach(audio => {
			audio.id != "blind-audio" && audio.pause();
		});

		canChangeSlide = false;
		if (slide > currentSection) {
			if (currentSection == 0) {
				previousTopicButton.style.display = "none";
				previousSlideButton.style.display = "inline-block";
				previousSlideButton.toggleAttribute("disabled", false);
			}
			if (currentSection <= numberOfSections - 1) {
				currentSection = slide;
				if (currentSection === numberOfSections - 1) {
					nextSlideButton.style.display = "none";
					nextTopicButton.style.display = "inline-block";
				}
			}
		}
		else {
			if (currentSection === numberOfSections - 1 && numberOfSections !== 1) {
				nextSlideButton.style.display = "inline-block";
				nextTopicButton.style.display = "none";
			}
			if (currentSection > 0) {
				if (slide === 0) {
					previousTopicButton.style.display = "inline-block";
					previousSlideButton.style.display = "none";
					previousSlideButton.toggleAttribute("disabled", true);
				}
			}
			currentSection = slide;
		}

		setTimeout(() => {
			if (iFrameDocument.getElementsByClassName("multiple-figures").length < 1 && iFrameDocument.getElementsByTagName("section")[currentSection])
				iFrameDocument.getElementsByTagName("section")[currentSection].className = "";
			iFrameDocument.getElementById("current-topic-slide").innerHTML = currentSection + 1;
			canChangeSlide = true;
			if (audioSourcesList.length > 0)
				updateBlindAudio(audioSourcesList[currentSection]);
		}, 100);
	}

	let openPreviousTopic = (e) => {
		if (canChangeSlide && pagesName.previousLink) {
			changeTopic(pagesName.previousLink, baseFolder);
			returnToLast = (pagesName.previousLink !== initialPage);
		}
	};
	let openPreviousSlide = (e) => {
		if (canChangeSlide)
			changeSlide(currentSection - 1);
	};
	let openNextSlide = (e) => {
		if (canChangeSlide) {
			changeSlide(currentSection + 1);
		}
	};
	let openNextTopic = (e) => {
		if (canChangeSlide) {
			returnToLast = false;
			changeTopic(pagesName.nextLink, baseFolder);
		}
	};

	let goBack = (e) => {
		parent.document.querySelector(`#${pagesName.previousLink}-nav-link>button`).click();
	};

	previousTopicButton.onclick = (!iFrame.src.includes(base + initial + ".html")) ? openPreviousTopic : goBack;
	previousSlideButton.onclick = openPreviousSlide;

	nextSlideButton.onclick = openNextSlide;
	nextTopicButton.onclick = openNextTopic;

	iFrameDocument.getElementById("blind-audio") && iFrameDocument.getElementById("blind-audio").addEventListener("ended", () => {
		if (currentSection === numberOfSections - 1) {
			nextTopicButton.click();
			setTimeout(() => {
				let iFrame2 = parent.document.getElementById("content-frame");
				let iFrameDocument2 = iFrame2.contentWindow.document || iFrame2.contentDocument;
				iFrameDocument2.getElementById("play-blind-audio").click();
			}, 200);
		}
		else
			nextSlideButton.click();
	});

	[
		(typeof parent.require !== 'undefined') && parent.require("mousetrap")(iFrame.contentWindow),
		(typeof parent.require !== 'undefined') && parent.require("mousetrap")(document),
		(typeof parent.require !== 'undefined') && parent.require("mousetrap")(parent.document)
	].forEach((Mousetrap) => {
		Mousetrap.unbind("right");
		Mousetrap.unbind("left");
		Mousetrap.bind("right", () => {
			if (currentSection === numberOfSections - 1) {
				nextTopicButton.click();
			}
			else {
				nextSlideButton.click();
			}
		});
		Mousetrap.bind("left", () => {
			if (currentSection === 0 && !iFrame.src.includes(base + initial + ".html")) {
				previousTopicButton.click();
			}
			else if (document.getElementById("back") && !document.getElementById("back").hasAttribute("disabled")) {
				previousSlideButton.click();
			}
		});

		Mousetrap.bind("ctrl+backspace", () => {
			if (document.getElementById("back") && !document.getElementById("back").hasAttribute("disabled")) {
				returnToListButton.click();
			}
		});
	});
}

/**
 * Cambia l'argomento correntemente mostrato.
 *
 * @param {String} topicName Il prossimo argomento
 * @param {String} [base] La cartella in cui è situato il file dell'argomento
 */
function changeTopic(topicName, base = "./") {
	let iFrame = document.getElementById("topic-frame");
	let iFrameDocument = iFrame.contentWindow.document || iFrame.contentDocument;
	let audio = iFrameDocument.getElementById("blind-audio");
	if (audio) {
		let paused = audio.paused && !audio.ended;
		setTimeout(() => {
			let iFrame2 = document.getElementById("topic-frame");;
			let iFrameDocument = iFrame2.contentWindow.document || iFrame2.contentDocument;
			if (!paused || isBlindAudioEnded) {
				let btn = iFrameDocument.getElementById("play-blind-audio");

				// Se l'audio della nuova pagina risulta in pausa, deve essere
				// attivato. Questa controllo è effettuato per evitare che
				// l'audio si blocchi inaspettatamente. È effettuato inoltre un
				// controllo aggiuntivo per evitare di eseguire l'operazione se
				// la nuova pagina non prevede un audio per non vedenti.
				let newAudio = iFrameDocument.getElementById("blind-audio");
				if (newAudio && newAudio.paused) // se il nuovo audio risulta in pausa...
					btn && btn.click(); // ...attivalo premendo il bottone "play"
			}
		}, 300);
	}

	currentSection = 0;
	parent.document.activeElement.blur();
	const path = (typeof parent.require !== 'undefined') && parent.require("path");
	if (!topicName.includes("quiz")) {
		iFrame.src = `${path.join(base, `${topicName}.html`)}`;
	}
	else
		(typeof parent.require !== 'undefined') && parent.require("electron").remote.getCurrentWindow().loadFile(base + topicName + ".html");
}

/**
 * Inizializza la pagina del quiz.
 */
function initializeQuiz() {
	sectionsList = document.getElementsByTagName("section");

	numberOfSections = sectionsList.length;
	currentSection = 0;
	canChangeSlide = true;

	sectionsList[currentSection].className = "";

	var previousSlideButton = document.getElementById("back");
	var nextSlideButton = document.getElementById("next");
	var verifyButton = document.getElementById("end");
	var exitButton = document.getElementById("exit");

	let nextSlide = () => {
		if (canChangeSlide)
			changeQuizSlide(currentSection + 1);
	};
	let previousSlide = () => {
		if (canChangeSlide) {
			if (currentSection > 0) {
				changeQuizSlide(currentSection - 1);
			}
			else {
				parent.document.querySelector(`#exit-quiz-nav-link>button`).click();
			}
		}
	};

	exitButton.style.display = "none";
	verifyButton.style.display = "none";

	previousSlideButton.onclick = previousSlide;
	nextSlideButton.onclick = nextSlide;

	const Mousetrap = require("mousetrap")(document);
	Mousetrap.bind("right", () => {
		if (canChangeSlide) {
			if (currentSection === numberOfSections - 1) {
				if (!compare)
					verifyButton.click();
				else
					exitButton.click();
			} else
				nextSlideButton.click();
		}
	});
	Mousetrap.bind("left", () => {
		if (canChangeSlide) {
			if (currentSection !== 0)
				previousSlideButton.click();
		}
	});
}

/**
 * Cambia la slide del quiz attualmente mostrata.
 * 
 * @param {number} finalSlide La slide da aprire in seguito alla
 * richiesta di variazione della slide. Tale valore deve essere
 * compreso nell'intervallo `[0, n]`, dove `n` è il numero di slide
 * presenti nella pagina.
 */
function changeQuizSlide(finalSlide) {
	document.activeElement.blur();
	var previousSlideButton = document.getElementById("back");
	var nextSlideButton = document.getElementById("next");
	var verifyButton = document.getElementById("end");
	var exitButton = document.getElementById("exit");

	canChangeSlide = false;
	sectionsList[currentSection].className = "hide";

	var questionsInNavbar = document.getElementsByClassName("question-link");
	questionsInNavbar[currentSection].className = "question-link";

	currentSection = finalSlide;

	if (currentSection === numberOfSections - 1) {
		nextSlideButton.style.display = "none";
		if (compare) {
			exitButton.style.display = "inline-block";
			verifyButton.style.display = "none";
		} else {
			verifyButton.style.display = "inline-block";
			exitButton.style.display = "none";
		}
	}
	else {
		verifyButton.style.display = "none";
		exitButton.style.display = "none";
		nextSlideButton.style.display = "inline-block";
	}

	setTimeout(() => {
		sectionsList[currentSection].className = "";
		questionsInNavbar[finalSlide].className = "question-link active";
		canChangeSlide = true;
	}, 100);
}

/**
 * Permette di avviare, mettere in pausa o stoppare un audio.
 *
 * @param {String} audioTagId L'ID dell'elemento `<audio>` da controllare
 * @param {HTMLElement} buttonRef Un riferimento al bottone che richiama questa
 * funzione
 * @param {String} stopButtonId L'ID del bottone di Stop.
 */
function playStopAudio(audioTagId, buttonRef, stopButtonId) {
	var audio = document.getElementById(audioTagId);
	buttonRef.blur();

	audio.addEventListener("ended", endBlindAudio);
	buttonRef.className = "btn-audio";
	document.getElementById(stopButtonId).style.display = "inline-block";

	if (audio.paused) {
		buttonRef.innerHTML = "<i class=\"fas fa-pause\"></i>";
		audio.play();
		buttonRef.className = buttonRef.className.replace("audio-stopped", "audio-playing");
	}
	else {
		buttonRef.innerHTML = "<i class=\"fas fa-play\"></i>";
		audio.pause();
		buttonRef.className = buttonRef.className.replace("audio-playing", "audio-stopped");
	}

	document.getElementById(stopButtonId).onclick = () => {
		audio.currentTime = 0;
		isBlindAudioEnded = false;
	};
}

var lastPressed = { button: null, container: null };

function hideSubButtons(mainButton, containerId) {
	lastPressed = { button: null, container: null };

	mainButton.parentElement.classList.toggle("clicked");
	mainButton.childNodes[1].style.visibility = "visible";

	let container = document.getElementById(containerId);
	setTimeout(() => {
		container.style.visibility = "hidden";
		container.style.opacity = 0;
		container.style.display = "none";
		mainButton.style.display = "";
		mainButton.style.visibility = "visible";
		mainButton.style.opacity = 1;

	}, 300);
}

function showSubButtons(mainButton, containerId) {
	parent.document.activeElement.blur();

	if (lastPressed.button && lastPressed.container)
		hideSubButtons(lastPressed.button, lastPressed.container);
	lastPressed = { button: mainButton, container: containerId };

	mainButton.parentElement.classList.toggle("clicked");

	mainButton.childNodes[1].style.visibility = "hidden";

	setTimeout(() => {
		mainButton.style.visibility = "hidden";
		mainButton.style.opacity = 0;
		mainButton.style.display = "none";
		let container = document.getElementById(containerId);
		container.style.display = "";
		container.style.visibility = "visible";
		container.style.opacity = 1;
	}, 300);
}

/**
 * Associa a tutte le figure presenti nel documento un evento "click" che
 * consente di visualizzarle in una finestra modale.
 */
(function () {
	let figures = Array.prototype.slice.call(document.getElementsByTagName("figure"));

	figures.forEach(fig => {
		let showImageModal = () => {
			let realDocument = (parent.document !== document) ? parent.parent.document : parent.document;

			if (!/.*?modal.*?/i.test(fig.className)) {
				var backupFig = fig.cloneNode(true);
				fig.insertAdjacentElement("afterend", backupFig);

				let closeButton = document.createElement("button");
				closeButton.className = "close-btn";
				closeButton.innerHTML = "<i class=\"fas fa-times\"></i>";
				fig.appendChild(closeButton);

				fig.style = "";

				if (parent.document !== document)
					fig.getElementsByTagName("img")[0].src = fig.getElementsByTagName("img")[0].src.replace("../../../", "./");

				fig = realDocument.body.appendChild(fig);
				closeButton = fig.getElementsByTagName("button")[0];

				let closeModal = () => {
					fig.className = fig.className.replace("modal", "");
					closeButton.parentElement.removeChild(closeButton);

					setTimeout(() => {
						fig.addEventListener("click", showImageModal);
					}, 100);

					fig.parentElement.removeChild(fig);
					fig = backupFig;
					realDocument.activeElement.blur();
				};

				closeButton.onclick = closeModal;
				fig.className += " modal";
				fig.removeEventListener("click", showImageModal);
				fig.addEventListener("click", closeModal);
			}
		};

		fig.addEventListener("click", showImageModal);
	});
})();

/**
 * Apre una finestra modale mostrante il contenuto richiesto.
 * 
 * @param {String} content Il link (assoluto o relativo) da aprire 
 * @param {Object} [options] Le opzioni della nuova finestra
 * @param {String} [windowIcon] L'icona della finestra modale
 */
function openModal(content, options = { width: 1400, height: 800 }, windowIcon = "./assets/icon.ico") {
	const path = window.parent.require("path");
	var xhr = new XMLHttpRequest();
	let currentPageName = (typeof __filename !== 'undefined') ? __filename.split(path.sep).pop() : undefined;
	let moduleBase = (currentPageName == "quiz.html") ? "../../" : "./";
	xhr.open('GET', path.join(moduleBase, content), true);
	xhr.onreadystatechange = function () {
		if (this.readyState !== 4) return;
		if (this.status !== 200) return;
		const Dialog = window.parent.require(`${moduleBase}assets/js/modal-dialog-module`);
		let modalDialog = new Dialog;
		let width = (options.width && options.width <= window.innerWidth - 20) ? options.width : window.innerWidth - 20;
		let height = (options.height && options.height <= window.innerHeight - 20) ? options.height : window.innerHeight - 20;
		modalDialog.open({
			icon: `${moduleBase}assets/icon.ico`,
			title: /<title>(.*?)<\/title>/gi.exec(this.responseText)[1],
			width: width,
			height: height,
			content: /<body>((?:.|\s)*?)<\/body>/gmi.exec(this.responseText)[1],
			buttons: {},
			center: false,
		});
		if (content.match(/about\.html/)) {
			let bibliographyLinks = Array.from(document.querySelectorAll("#bibliography a"));
			bibliographyLinks.forEach(link => {
				let currentLink = link.href;
				link.href = "javascript:void(0)";
				link.classList.add("external");
				link.onclick = () => { openInBrowser(currentLink); };
			});
		}
	};
	xhr.send();
}

/**
 * Mostra il dialogo con il punteggio dei quiz.
 *
 * @param {String} nomeQuiz Il nome del quiz.
 * @param {number} score Il punteggio ottenuto.
 * @param {number} total Il punteggio totale possibile.
 * @param {String} return_link  Il file da aprire se è cliccato il tasto 'Ok'.
 * Il percorso è relativo rispetto alla cartella principale.
 */
function showQuizDialog(nomeQuiz, score, total, return_link) {
	const path = window.parent.require("path");
	const { ipcRenderer } = window.parent.require("electron");
	ipcRenderer.sendSync("save-quiz", { id: nomeQuiz, passed: (score >= (total / 2)) });
	const Dialog = window.parent.require("../../assets/js/modal-dialog-module");
	let quizDialog = new Dialog;
	quizDialog.open({
		icon: "../../assets/icon.ico",
		title: 'Quiz - Risultato',
		content: `<p>Hai ottenuto in punteggio di:</p>
		<p><strong style="font-size: x-large;"><span id="score">${score}</span> / <span id="total">${total}</span></strong></p>`,
		buttons: {
			"Ok": {
				style: "btn-outlined",
				autofocus: false,
				callback: () => { window.location.href = `../../index.html?started=true&topic=${return_link}&to-home=true`; }
			},
			"Verifica": {
				style: "btn",
				autofocus: true,
				callback: () => { quizCompare(); quizDialog.close(); }
			}
		}
	});
}

/**
 * Mostra il dialogo di richiesta di conferma di uscita dal quiz.
 *
 * @param {String} toOpen Il file da aprire se è cliccato il tasto 'Sì'. Il
 * percorso è relativo rispetto alla cartella principale.
 */
function showExitFromQuizDialog(toOpen) {
	const path = window.parent.require("path");
	const Dialog = window.parent.require("../../assets/js/modal-dialog-module");
	let exitQuizDialog = new Dialog;
	exitQuizDialog.open({
		icon: "../../assets/icon.ico",
		title: 'Sicuro?',
		content: "Sicuro di voler uscire dal quiz?",
		buttons: {
			"No": {
				style: "btn-outlined",
				autofocus: false,
				callback: () => { exitQuizDialog.close(); }
			},
			"Sì": {
				style: "btn",
				autofocus: true,
				callback: () => { window.location.href = `../../index.html?started=true&topic=${toOpen}&to-home=false`; }
			}
		}
	});
}

/**
 * Mostra il dialogo di richiesta di conferma di uscita.
 */
function showExitDialog() {
	const path = window.parent.require("path");
	let currentPageName = (typeof __filename !== 'undefined') ? __filename.split(path.sep).pop() : undefined;
	let moduleBase = (currentPageName == "quiz.html") ? "../../" : "./";
	const Dialog = window.parent.require(`${moduleBase}assets/js/modal-dialog-module`);
	let exitDialog = new Dialog;
	exitDialog.open({
		icon: `${moduleBase}assets/icon.ico`,
		title: 'Sicuro?',
		content: "<p>Sicuro di voler uscire dall'applicazione?</p>",
		buttons: {
			"No": {
				style: "btn-outlined",
				autofocus: false,
				callback: () => { exitDialog.close(); }
			},
			"Sì": {
				style: "btn",
				autofocus: true,
				callback: () => { remote.app.quit(); }
			}
		}
	});
}

function openPage(pageToOpen, buttonToSetActiveId) {
	let iFrame = parent.document.getElementById("content-frame");
	iFrame.focus();
	var params = (new URL(location.href)).searchParams;
	document.querySelector("nav.main-navigation>ul li>button.active").classList.remove("active");
	document.querySelector(`#${buttonToSetActiveId}-nav-link>button`).classList.add("active");
	if (pageToOpen != params.get("topic")) {
		iFrame.src = pageToOpen;
		window.history.replaceState(null, null, `?started=true&topic=${pageToOpen}${(params.has("sub-topic") ? `&sub-topic=${params.get("sub-topic")}` : "")}`);
	}
}

function setHelper(newHelper) {
	document.querySelector("#help-nav-link>button").onclick = () => {
		openModal(`./helpers/help-${newHelper}.html`);
	}
}

var shortcutDisabled = false;

function disableShortcuts() {
	shortcutDisabled = true;
}

function setShortcuts(doc = document) {
	if (!shortcutDisabled) {
		const Mousetrap = (typeof window.parent.require !== 'undefined') ? window.parent.require("mousetrap")(doc) : window.parent.parent.require("mousetrap")(doc);

		Mousetrap.bind("alt+h", () => { !window.location.href.includes("quiz.html") && parent.document.querySelector("#home-nav-link>button").click(); });
		Mousetrap.bind("alt+t", () => { !window.location.href.includes("quiz.html") && parent.document.querySelector("#theory-nav-link>button").click(); });
		Mousetrap.bind("alt+s s", () => { !window.location.href.includes("quiz.html") && parent.document.querySelector("#instruments-nav-link>button").click(); });
		Mousetrap.bind("alt+s c", () => { !window.location.href.includes("quiz.html") && warnIfIncomplete('base', 'teoria base', 'agli strumenti', () => { parent.window.location.href = "./index.html?started=true&topic=./teoria-chitarra.html&to-home=false"; }); });
		Mousetrap.bind("alt+s b", () => { !window.location.href.includes("quiz.html") && warnIfIncomplete('base', 'teoria base', 'agli strumenti', () => { parent.window.location.href = "./index.html?started=true&topic=./teoria-basso.html&to-home=false"; }); });
		Mousetrap.bind("alt+s shift+b", () => { !window.location.href.includes("quiz.html") && warnIfIncomplete('base', 'teoria base', 'agli strumenti', () => { parent.window.location.href = "./index.html?started=true&topic=./teoria-batteria.html&to-home=false"; }); });
		Mousetrap.bind("alt+s p", () => { !window.location.href.includes("quiz.html") && warnIfIncomplete('base', 'teoria base', 'agli strumenti', () => { parent.window.location.href = "./index.html?started=true&topic=./teoria-piano.html&to-home=false"; }); });
		Mousetrap.bind("alt+a a", () => { !window.location.href.includes("quiz.html") && parent.document.querySelector("#chords-nav-link>button").click(); });
		Mousetrap.bind("alt+a c", () => { !window.location.href.includes("quiz.html") && warnIfIncomplete('chitarra', 'teoria della chitarra', 'agli accordi della chitarra', () => { parent.window.location.href = "./index.html?started=true&topic=./accordi-chitarra.html&to-home=false"; }); });
		Mousetrap.bind("alt+a b", () => { !window.location.href.includes("quiz.html") && warnIfIncomplete('basso', 'teoria del basso', 'agli accordi del basso', () => { parent.window.location.href = "./index.html?started=true&topic=./accordi-basso.html&to-home=false"; }); });
		Mousetrap.bind("alt+a p", () => { !window.location.href.includes("quiz.html") && warnIfIncomplete('piano', 'teoria del pianoforte', 'agli accordi del pianoforte', () => { parent.window.location.href = "./index.html?started=true&topic=./accordi-piano.html&to-home=false"; }); });
		Mousetrap.bind("alt+p", () => { !window.location.href.includes("quiz.html") && parent.document.querySelector("#profile-nav-link>button").click(); });
		Mousetrap.bind("alt+m", () => { !window.location.href.includes("quiz.html") && openModal("./map.html"); });
		Mousetrap.bind("alt+i", () => { !window.location.href.includes("quiz.html") && openModal("./about.html"); });
		Mousetrap.bind("f1", () => { parent.document.querySelector("#help-nav-link>button").click(); });
		Mousetrap.bind("esc", showExitDialog);
		Mousetrap.bind("up up down down left right left right b a enter", () => {
			const Dialog = window.parent.require("./assets/js/modal-dialog-module");
			let bonusDialog = new Dialog;
			bonusDialog.open({
				title: 'Wow!',
				content: `<p>Wow! Fai anche tu parte del ristretto club di giocatori NES?!<br />
				Siamo onorati di averti come nostro utente!<br />
				<i>&mdash; by FSC</i></p>`,
				buttons: {
					"Ehm... Ok": {
						style: "btn-outlined",
						autofocus: false,
						callback: () => { bonusDialog.close(); }
					},
					"Wow!": {
						style: "btn",
						autofocus: true,
						callback: () => { bonusDialog.close(); }
					}
				}
			});
		});

		// Audio per i non vedenti
		Mousetrap.bind("ctrl+space", () => {
			let btn = document.getElementById("play-blind-audio");
			if (!btn) {
				let iFrame = document.getElementById("content-frame");
				let iFrameDocument = iFrame && (iFrame.contentWindow.document || iFrame.contentDocument);
				iFrame && (iFrame = iFrameDocument.getElementById("topic-frame"));
				iFrame && (iFrameDocument = iFrame.contentWindow.document || iFrame.contentDocument);

				iFrame && (btn = iFrameDocument.getElementById("play-blind-audio"));
			}
			btn && btn.click();
		});
		Mousetrap.bind("ctrl+alt+space", () => {
			let btn = document.getElementById("stop-blind-audio");
			if (!btn) {
				let iFrame = document.getElementById("content-frame");
				let iFrameDocument = iFrame.contentWindow || iFrame.contentDocument;
				btn = iFrameDocument.document.getElementById("stop-blind-audio");
			}
			btn && btn.click();
		});
	}
}

let onLoadCallback = () => { setShortcuts(document); }
window.removeEventListener("load", onLoadCallback);
window.addEventListener("load", onLoadCallback);