import { IsNotEmpty, IsString, IsNumber, IsIn, IsOptional, Min, IsUUID, IsArray } from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsString()
  descricao: string;

  @IsNotEmpty()
  @IsIn(['Mão de Obra', 'Material para a Casa', 'Material de Apoio', 'Serviços e Locações'])
  categoria: string;

  @IsNotEmpty()
  @IsString()
  subcategoria: string;

  @IsOptional()
  @IsString()
  etapa?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_bruto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  desconto?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  valor_final: number;

  @IsOptional()
  @IsIn(['Pago', 'Pendente'])
  status?: string;

  @IsNotEmpty()
  @IsIn(['PIX', 'DINHEIRO', 'CARTAO_CREDITO_JOAO', 'CARTAO_PRETO_CREDITO_FOFO'])
  origem_pagamento: string;

  @IsNotEmpty()
  @IsIn(['João', 'Fofo'])
  responsavel: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  parcelas_total?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  valores_parcelas?: number[];

  // Os campos abaixo serão calculados/preenchidos pelo backend (não exigidos do client na criação primária)
  @IsOptional()
  @IsNumber()
  @Min(1)
  parcela_numero?: number;

  @IsOptional()
  @IsNumber()
  valor_parcela?: number;

  @IsOptional()
  @IsString()
  data_vencimento?: string;

  @IsOptional()
  @IsUUID()
  compra_grupo_id?: string;

  @IsOptional()
  @IsString()
  link_comprovante?: string;

  @IsOptional()
  @IsString()
  comprovante_url?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
