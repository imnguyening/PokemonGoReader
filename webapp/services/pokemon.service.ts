import { Injectable } from '@angular/core'
import { Headers, Http } from '@angular/http'
import 'rxjs/add/operator/toPromise'

import { UserLogin } from '../models/user-login.model'
import { Pokemon } from '../models/pokemon.model'
import { Species } from '../models/species.model'
import { Move } from '../models/move.model'

import { PropertiesService } from './properties.service'


@Injectable()
export class PokemonService {
	private _pokemon : Pokemon[] = [];
	private _species: Species[] = [];
	private _userLogin: UserLogin = null;

	constructor(
		private _http: Http,
		private _properties: PropertiesService
	) {}

	public get pokemon(): Pokemon[]{
		return this._pokemon
	}

	public get species(): Species[]{
		return this._species
	}

	public get userLogin(): UserLogin {
		return this._userLogin;
	}

	public set userLogin(userLogin: UserLogin){
		this._userLogin = userLogin;
	}

	public retrievePokemon () {
		let headers = new Headers({
			'Content-Type': 'application/json'});
		return this._http
		.post(
			this._properties.apiHost + this._properties.getPokemonRoute, 
			JSON.stringify(this._userLogin), 
			{headers: headers}
		)
		.toPromise()
		.then(res => {
			let resBody = res.json();
			this._pokemon = resBody.pokemon as Pokemon[];
			this._pokemon = this._pokemon.map(function (pokemon) {
				pokemon.type_1 = window['pokemon'][pokemon.pokedex_number].Type1.toLowerCase();
				pokemon.type_2 = window['pokemon'][pokemon.pokedex_number].Type2.toLowerCase();

				pokemon.moves = {
					fast: window['pokemon'][pokemon.pokedex_number].QuickMoves.map(function (moveNumber: string) {
						let move: any = window['moves'][moveNumber.toString()];
						
						let givesStab: boolean = false;
						let dps: number = move.DPS;

						if(move.Type.toLowerCase() === pokemon.type_1 || move.Type.toLowerCase() === pokemon.type_2){
							givesStab = true;
							dps = Number((dps * 1.25).toFixed(2));
						}

						return new Move(
							move.Type.toLowerCase(),
							pokemon.move_1.toString() === moveNumber.toString(),
							dps,
							move.Name,
							givesStab
						);
					}),
					charged: window['pokemon'][pokemon.pokedex_number].CinematicMoves.map(function (moveNumber: string) {
						let move: any = window['moves'][moveNumber.toString()];

						let givesStab: boolean = false;
						let dps: number = move.DPS;

						if(move.Type.toLowerCase() === pokemon.type_1 || move.Type.toLowerCase() === pokemon.type_2){
							givesStab = true;
							dps = Number((dps * 1.25).toFixed(2));
						}

						return new Move(
							move.Type.toLowerCase(),
							pokemon.move_2.toString() === moveNumber.toString(),
							dps,
							move.Name,
							givesStab
						);
					})
				};

				pokemon.moves.fast = pokemon.moves.fast.sort((a,b) => {
					if ( a.DPS < b.DPS ) return 1;
					if ( a.DPS > b.DPS) return -1;
					return 0;
				});

				pokemon.moves.charged = pokemon.moves.charged.sort((a,b) => {
					if ( a.DPS < b.DPS ) return 1;
					if ( a.DPS > b.DPS) return -1;
					return 0;
				});

				return pokemon;
			});

			this._species = resBody.species as Species[];
			this._userLogin.token = resBody.token;
		})
		.catch(this.handleError);
	}

	public transferPokemon(pokemon: Pokemon){
		let headers = new Headers({
			'Content-Type': 'application/json'});

		let request = {
			username: this._userLogin.username,
			password: this._userLogin.password,
			type: this._userLogin.type,
			token: this._userLogin.token,
			id: pokemon.id
		};

		return this._http
		.post(
			this._properties.apiHost + this._properties.transferPokemonRoute,
			JSON.stringify(request),
			{headers: headers}
		)
		.toPromise()
		.then(res => {
			this._userLogin.token = res.json().token;
		})
		.catch(this.handleError);
	}

	public renamePokemon(pokemon: Pokemon, nickname: string){
		let headers = new Headers({
			'Content-Type': 'application/json'});

		let request = {
			username: this._userLogin.username,
			password: this._userLogin.password,
			token: this._userLogin.token,
			type: this._userLogin.type,
			id: pokemon.id,
			nickname: nickname
		};

		return this._http
		.post(
			this._properties.apiHost + this._properties.renamePokemonRoute,
			JSON.stringify(request),
			{headers: headers}
		)
		.toPromise()
		.then(res => {
			this._userLogin.token = res.json().token;
		})
		.catch(this.handleError);
	}

	public toggleFavoritePokemon(pokemon: Pokemon) {
		let headers = new Headers({
			'Content-Type': 'application/json'});

		let request = {
			username: this._userLogin.username,
			password: this._userLogin.password,
			type: this._userLogin.type,
			token: this._userLogin.token,
			id: pokemon.id,
			favorite: !pokemon.favorite
		};

		return this._http
		.post(
			this._properties.apiHost + this._properties.favoritePokemonRoute,
			JSON.stringify(request),
			{headers: headers}
		)
		.toPromise()
		.then(res => {
			this._userLogin.token = res.json().token;
		})
		.catch(this.handleError);
	}

	private handleError(error: any) {
		console.error('An error occurred', error);
		return Promise.reject(error.message || error);
	}
}