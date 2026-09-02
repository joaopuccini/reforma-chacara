import { IsNotEmpty, IsString, IsNumber, IsIn, IsOptional, Min } from 'class-validator';

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

  @IsOptional()
  @IsString()
  parcelas?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pago_joao?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pago_fofo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pendente?: number;

  @IsOptional()
  @IsString()
  link_comprovante?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
