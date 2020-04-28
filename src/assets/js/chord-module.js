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

"use strict";

/**
 * Classe accordo.
 * @param {String} nome Stringa che indica il nome dell'accordo
 * @param {Boolean} dita Sequenza di valori logici che indicano se la checkbox corrispondente è
 * stata selezionata o meno
 * @param {number} [tasto_iniziale=0] Indica il numero del capotasto iniziale dell'accordo
 */
class Chord {
	constructor(nome, dita, tasto_iniziale = 0) {
		this.nome = nome;
		this.dita = dita;
		this.tasto_iniziale = tasto_iniziale;
	}
}

window.Chord = Chord
module.exports = Chord;
