import { I } from 'ts/lib';

export enum ViewType { Grid };
export enum PropertyType { Title, Text, Number };

export interface Property {
	id: string;
	name: string;
	type: PropertyType;
};

export interface View {
	id: string;
	name: string;
	type: ViewType;
};

export interface ContentDataView {
	view: string;
	properties: Property[];
	views: View[];
	data: any[];
};

export interface BlockDataView extends I.Block {
	content: ContentDataView;
};