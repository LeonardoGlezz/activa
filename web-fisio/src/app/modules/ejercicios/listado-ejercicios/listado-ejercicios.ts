import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Exercise } from '../../../core/exercises/domain/exercise.model';
import { ExerciseUseCase } from '../../../core/exercises/application/exercise.use-case';

@Component({
  selector: 'app-listado-ejercicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listado-ejercicios.html',
  styleUrls: ['./listado-ejercicios.scss']
})
export class ListadoEjercicios implements OnInit {
  exercises: Exercise[] = [];         
  filteredExercises: Exercise[] = []; 
  searchTerm: string = '';            
  loading = false;

  constructor(private exerciseUseCase: ExerciseUseCase) {}

  ngOnInit(): void {
    this.loadExercises();
  }

  loadExercises(): void {
    this.loading = true;
    this.exerciseUseCase.listExercises(1, 10).subscribe({
      next: (result) => {
        this.exercises = result.rows; 
        this.filteredExercises = result.rows;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch(): void {
    const term = this.normalizeText(this.searchTerm);
    if (!term) {
      this.filteredExercises = [...this.exercises];
      return;
    }
    this.filteredExercises = this.exercises.filter(ex => 
      this.normalizeText(ex.name).includes(term) || 
      this.normalizeText(ex.bodyZone || '').includes(term)
    );
  }

  private normalizeText(text: string): string {
    return text ? text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';
  }
}